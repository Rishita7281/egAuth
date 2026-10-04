const express=require('express')
const router=express.Router()
const { userLogin, empLogin, deptLogin, guestUserLogin, guestEmpLogin, guestDeptLogin } = require('../controller/login')
const { validate } = require('../middleware/validate')
const schemas = require('../validation/schemas')

// router.get('/userLogin',userLogin)
// router.get('/deptLogin',deptLogin)
// router.get('/empLogin',empLogin)

router.post('/userLogin', validate(schemas.userLogin), userLogin)
router.post('/deptLogin', validate(schemas.deptLogin), deptLogin)
router.post('/empLogin', validate(schemas.empLogin), empLogin)
router.post('/userGuest', guestUserLogin)
router.post('/empGuest', guestEmpLogin)
router.post('/deptGuest', guestDeptLogin)

module.exports=router 
