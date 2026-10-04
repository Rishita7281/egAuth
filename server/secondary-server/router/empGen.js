const express=require('express')
const router=express.Router()
const {authEmpJWT}=require('../middleware/auth')
const { genEmp } = require('../controller/genEmp')


router.post('/gen',authEmpJWT,genEmp)

module.exports=router