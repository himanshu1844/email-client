const express=require("express")
const router=express.Router();
// const prisma = require("../db/db.js");
const getauthrurl=require("./controller/getauthrurl.js");
const callbackhandler = require("./controller/callbackhandler.js");
const initialsynchandler=require("./controller/initialsynchandler.js")


router.get("/authurl",getauthrurl);
router.get("/callback",callbackhandler);  
router.post("/initial_sync",initialsynchandler);
module.exports=router; 