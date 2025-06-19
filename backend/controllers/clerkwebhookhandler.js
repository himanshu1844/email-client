const prisma = require("../db/db.js"); 


const clerkWebhookHandler = async (req, res) => {
  try {
    const event = req.body;
    console.log("Received webhook payload:", event);

    const data = event.data;

    const firstName = data.first_name;
    const lastName = data.last_name;
    const id = data.id;
    const email = data.email_addresses[0].email_address;

   
    const user = await prisma.user.create({
      data: {
        id:id,
        email:email,
        firstName:firstName,
        lastName:lastName,
      },
    });

    return res.status(201).json({ success: true, user });
  } catch (err) {
    if (err.code === 'P2002') {
     
      return res.status(409).json({ error: "User already exists" });
    }

    console.error("Webhook error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = clerkWebhookHandler;
