const express=require('express')
const router=express.Router()
const { userRegister, deptRegister } = require('../controller/register')
const { validate } = require('../middleware/validate')
const schemas = require('../validation/schemas')


// router.get('/userRegister',userRgister)
router.post('/userRegister', validate(schemas.userRegister), userRegister)
router.post('/deptRegister', validate(schemas.deptRegister), deptRegister)

module.exports=router 
