const express=require('express')
const { authUserJWT } = require('../middleware/auth')
const { userScan } = require('../controller/userScan')
const { validate } = require('../middleware/validate')
const schemas = require('../validation/schemas')
const router=express.Router()


router.post('/scan',authUserJWT,validate(schemas.userScan),userScan)

module.exports=router
