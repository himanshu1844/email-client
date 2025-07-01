const prisma = require('../../db/db.js');
// Use require for commonjs if not explicitly module type

function getHeaderValue(headers, name) {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : null;
}

function getEmailAddressFromString(emailString) {
  const match = emailString.match(/<([^>]+)>/);
  return match ? match[1] : emailString;
}

function parseEmailAddresses(headerValue) {
  if (!headerValue) {
    return [];
  }
  return headerValue.split(',').map(part => getEmailAddressFromString(part.trim()));
}

function parseDateTime(dateString) {
  try {
    if (typeof dateString === 'number') {
      return new Date(dateString);
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch (error) {
    return null;
  }
}

const savetodb = async (messages, accountId) => {
    const pLimit = (await import('p-limit')).default;
  const limit = pLimit(10);

  if (!Array.isArray(messages)) {
    return;
  }

  try {
    for (let index = 0; index < messages.length; index++) {
      const message = messages[index];
      await limit(() => upsert_email(message, index, accountId));
    }
  } catch (error) {
    console.error(`Error saving messages to database:`, error.message);
  }
};

async function upsertAttachment(emailId, attachment) {
  try {
    await prisma.emailAttachment.upsert({
      where: { id: attachment.id || '' },
      update: {
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        inline: attachment.inline,
        contentId: attachment.contentId,
        content: attachment.content,
        contentLocation: attachment.contentLocation,
      },
      create: {
        id: attachment.id,
        emailId,
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        inline: attachment.inline,
        contentId: attachment.contentId,
        content: attachment.content,
        contentLocation: attachment.contentLocation,
      },
    });
  } catch (error) {
    console.log(`Failed to upsert attachment for email ${emailId}: ${error}`);
  }
}

async function upsert_email(email, index, accountId) {
  try {
    let emailLabelType = 'inbox';
    if (email.labelIds && (email.labelIds.includes('INBOX') || email.labelIds.includes('IMPORTANT'))) {
      emailLabelType = 'inbox';
    } else if (email.labelIds && email.labelIds.includes('SENT')) {
      emailLabelType = 'sent';
    } else if (email.labelIds && email.labelIds.includes('DRAFT')) {
      emailLabelType = 'draft';
    }

    const headers = email.payload?.headers || [];
    const fromHeaderValue = getHeaderValue(headers, 'From');
    const toHeaderValue = getHeaderValue(headers, 'To');
    const ccHeaderValue = getHeaderValue(headers, 'Cc');
    const bccHeaderValue = getHeaderValue(headers, 'Bcc');
    const subjectHeaderValue = getHeaderValue(headers, 'Subject');
    const dateHeaderValue = getHeaderValue(headers, 'Date');
    const messageIdHeaderValue = getHeaderValue(headers, 'Message-ID');
    const inReplyToHeaderValue = getHeaderValue(headers, 'In-Reply-To');
    const referencesHeaderValue = getHeaderValue(headers, 'References');
    const replyToHeaderValue = getHeaderValue(headers, 'Reply-To');

    const emailFrom = fromHeaderValue ? getEmailAddressFromString(fromHeaderValue) : '';
    const emailTo = parseEmailAddresses(toHeaderValue);
    const emailCc = parseEmailAddresses(ccHeaderValue);
    const emailBcc = parseEmailAddresses(bccHeaderValue);
    const emailReplyTo = parseEmailAddresses(replyToHeaderValue);

    const createdTime = parseDateTime(dateHeaderValue || email.internalDate);
    const receivedAt = parseDateTime(dateHeaderValue || email.internalDate);
    const sentAt = parseDateTime(dateHeaderValue || email.internalDate);
    const lastModifiedTime = new Date();

    const bodyPlainPart = email.payload?.parts?.find(part => part.mimeType === 'text/plain');
    const bodyHtmlPart = email.payload?.parts?.find(part => part.mimeType === 'text/html');

    let body = null;
    if (bodyPlainPart && bodyPlainPart.body?.data) {
      body = Buffer.from(bodyPlainPart.body.data, 'base64').toString('utf8');
    } else if (bodyHtmlPart && bodyHtmlPart.body?.data) {
      body = Buffer.from(bodyHtmlPart.body.data, 'base64').toString('utf8');
    }

    const allParticipantEmails = new Set([
      emailFrom,
      ...emailTo,
      ...emailCc,
      ...emailBcc,
      ...emailReplyTo
    ].filter(Boolean));

    const participantIds = Array.from(allParticipantEmails);

    const thread = await prisma.thread.upsert({
      where: { id: email.threadId },
      update: {
        subject: subjectHeaderValue,
        accountId: accountId,
        lastMessageDate: sentAt || new Date(),
        // done: false, // Don't reset 'done' unless explicitly desired
        participantIds: [...new Set([...(await prisma.thread.findUnique({ where: { id: email.threadId }, select: { participantIds: true } }))?.participantIds || [], ...participantIds])],
        inboxStatus: emailLabelType === 'inbox' || (await prisma.thread.findUnique({ where: { id: email.threadId }, select: { inboxStatus: true } }))?.inboxStatus,
        draftStatus: emailLabelType === 'draft' || (await prisma.thread.findUnique({ where: { id: email.threadId }, select: { draftStatus: true } }))?.draftStatus,
        sentStatus: emailLabelType === 'sent' || (await prisma.thread.findUnique({ where: { id: email.threadId }, select: { sentStatus: true } }))?.sentStatus,
      },
      create: {
        id: email.threadId,
        accountId,
        subject: subjectHeaderValue || 'No Subject',
        done: false,
        draftStatus: emailLabelType === 'draft',
        inboxStatus: emailLabelType === 'inbox',
        sentStatus: emailLabelType === 'sent',
        lastMessageDate: sentAt || new Date(),
        participantIds: participantIds,
      }
    });

    const createdEmail = await prisma.email.upsert({
      where: { id: email.id },
      update: {
        threadId: thread.id,
        createdTime: createdTime || new Date(),
        lastModifiedTime: lastModifiedTime,
        sentAt: sentAt || new Date(),
        receivedAt: receivedAt || new Date(),
        internetMessageId: messageIdHeaderValue || email.id,
        subject: subjectHeaderValue,
        sysLabels: email.labelIds || [],
        keywords: email.keywords || [],
        sysClassifications: email.sysClassifications || [],
        sensitivity: email.sensitivity || 'normal',
        meetingMessageMethod: email.meetingMessageMethod || null,
        from: emailFrom,
        to: emailTo,
        cc: emailCc,
        bcc: emailBcc,
        replyTo: emailReplyTo,
        hasAttachments: email.payload?.parts?.some(part => part.filename && part.filename !== '' && !['text/plain', 'text/html'].includes(part.mimeType)) || false,
        internetHeaders: headers,
        body: body,
        bodySnippet: email.snippet,
        inReplyTo: inReplyToHeaderValue,
        references: referencesHeaderValue,
        threadIndex: email.threadIndex,
        nativeProperties: email.nativeProperties || null,
        folderId: email.folderId || null,
        omitted: email.omitted || [],
        emailLabel: emailLabelType,
      },
      create: {
        id: email.id,
        emailLabel: emailLabelType,
        threadId: thread.id,
        createdTime: createdTime || new Date(),
        lastModifiedTime: lastModifiedTime,
        sentAt: sentAt || new Date(),
        receivedAt: receivedAt || new Date(),
        internetMessageId: messageIdHeaderValue || email.id,
        subject: subjectHeaderValue || 'No Subject',
        sysLabels: email.labelIds || [],
        internetHeaders: headers,
        keywords: email.keywords || [],
        sysClassifications: email.sysClassifications || [],
        sensitivity: email.sensitivity || 'normal',
        meetingMessageMethod: email.meetingMessageMethod || null,
        from: emailFrom,
        to: emailTo,
        cc: emailCc,
        bcc: emailBcc,
        replyTo: emailReplyTo,
        hasAttachments: email.payload?.parts?.some(part => part.filename && part.filename !== '' && !['text/plain', 'text/html'].includes(part.mimeType)) || false,
        body: body,
        bodySnippet: email.snippet,
        inReplyTo: inReplyToHeaderValue,
        references: referencesHeaderValue,
        threadIndex: email.threadIndex,
        nativeProperties: email.nativeProperties || null,
        folderId: email.folderId || null,
        omitted: email.omitted || [],
      }
    });

    const attachmentsToCreate = [];
    email.payload?.parts?.forEach(part => {
      if (part.filename && part.filename !== '' && !['text/plain', 'text/html'].includes(part.mimeType)) {
        attachmentsToCreate.push({
          id: part.partId, // Using partId as attachment ID if unique, or let cuid generate
          name: part.filename,
          mimeType: part.mimeType,
          size: part.body?.size || 0,
          inline: part.headers?.some(h => h.name.toLowerCase() === 'content-disposition' && h.value.includes('inline')) || false,
          contentId: getHeaderValue(part.headers, 'Content-ID'),
          content: part.body?.data,
          contentLocation: getHeaderValue(part.headers, 'Content-Location'),
          emailId: createdEmail.id,
        });
      }
    });

    if (attachmentsToCreate.length > 0) {
      for (const attachment of attachmentsToCreate) {
        await upsertAttachment(createdEmail.id, attachment);
      }
    }

    const threadEmails = await prisma.email.findMany({
      where: { threadId: thread.id },
      orderBy: { receivedAt: 'asc' }
    });

    let threadFolderType = 'sent';
    for (const threadEmail of threadEmails) {
      if (threadEmail.emailLabel === 'inbox') {
        threadFolderType = 'inbox';
        break;
      } else if (threadEmail.emailLabel === 'draft') {
        threadFolderType = 'draft';
      }
    }

    await prisma.thread.update({
      where: { id: thread.id },
      data: {
        draftStatus: threadFolderType === 'draft',
        inboxStatus: threadFolderType === 'inbox',
        sentStatus: threadFolderType === 'sent',
      }
    });
  } catch (error) {
    if (error.code && error.code.startsWith('P')) {
      console.log(`Prisma error for email ${email.id}: ${error.message}`);
    } else {
      console.log(`Unknown error for email ${email.id}: ${error}`);
    }
  }
}

module.exports = savetodb;