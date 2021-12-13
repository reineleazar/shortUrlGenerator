if(process.env.NODE_ENV !== 'production')
{
    require('dotenv').config()
}

const mongoose = require('mongoose')
const express = require('express')
const app = express()
const initializePassport = require('./passport-config')
const bcrypt = require('bcrypt')
const flash = require('express-flash')
//const session = require('express-session')
const session = require('cookie-session')
// const LocalStrategy = require('passport-local').Strategy
const passport  = require('passport')
const methodOverride = require('method-override')
const shortUrl = require('./models/shortUrl')

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/urlDbase', { //urlDbase = name of database
    useNewUrlParser: true
}) 

initializePassport(passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)

app.set('view-engine', 'ejs')
app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,  
    proxy : true, // add this when behind a reverse proxy, if you need secure cookies
    cookie : {
        secure : true,
        maxAge: 5184000000 // 2 months
    }  
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use('/public/',express.static("public"))


app.get('/index',checkAuthenticated, async (req,res)=>{
//find the docu using the id of authenticated user

if(req.user.admin){
    const urlDbase= await shortUrl.find({})
    res.render('admin.ejs', { shortLink: urlDbase })
    
}
else{
    const urlDbase= await shortUrl.findOne({_id: req.user._id})
    res.render('index.ejs', { shortLink: urlDbase, title:true, name:true, link:true, nameholder:req.body.urlName})
    
}



})
app.get('/',checkNotAuthenticated, (req,res)=>{
res.render('login.ejs')
})

app.get('/register',checkNotAuthenticated, (req,res)=>{
res.render('register.ejs',{username:true,email:true,password:true,emailcheck:req.body.email})
})



app.post('/register',checkNotAuthenticated, async (req,res)=>{
    const user = await shortUrl.findOne({email: req.body.email})
    const bodycheck1 = req.body.username  == ""
    const bodycheck2 = req.body.email  == ""
    const bodycheck3 = req.body.password  == ""
   
    if(bodycheck1 || bodycheck2 || bodycheck3){
        res.render('register.ejs', {username:!bodycheck1,email:!bodycheck2,password:!bodycheck3,emailcheck:req.body.email})
    }   
    else if(user)
    {
        //email already taken
        res.render('register.ejs', {username:true,email:false,password:true,emailcheck:req.body.email})
    }
    else
    {
        try{ 
        const hashedPassword = await bcrypt.hash(req.body.password,10)
        await shortUrl.create({
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email,
            shortUrl:[]
            })
        res.redirect('/')
    }
    catch(err){
        console.log(err)
        res.redirect('/register')
    }
    }
    
})

app.post('/create',checkAuthenticated,async (req,res)=>{
    const nameCheck = await shortUrl.findOne({shortUrl:{$elemMatch:{name: req.body.urlName}}})
    const urlDbase= await shortUrl.findOne({_id: req.user._id})
    const bodycheck1 = req.body.title  == ""
    const bodycheck2 = req.body.urlName  == ""
    const bodycheck3 = req.body.fullLink  == ""
    
    if(bodycheck1 || bodycheck2 || bodycheck3){
        res.render('index.ejs', {shortLink: urlDbase, title:!bodycheck1,name:!bodycheck2,link:!bodycheck3, nameholder:req.body.urlName})
    }    
    else if(nameCheck)
    {
        res.render('index.ejs', { shortLink: urlDbase,  title:true, name:false, link:true, nameholder:req.body.urlName })
    }
    else{

            try{
                await shortUrl.findOneAndUpdate({ _id: req.user._id},
                {$addToSet:{shortUrl:[{title: req.body.title,name: req.body.urlName,
                            fullLink: req.body.fullLink,}]}})

                res.redirect('/index')
            }catch(err)
            {
              console.log(err)
            }
        
            
    }

})

app.post('/delete/:query', async (req, res) =>{ //delete button
    try{
        await shortUrl.findOneAndUpdate({ _id: req.user._id},
            {
                $pull:{shortUrl:{name: req.params.query}}
            })

        }catch(err){
            console.log(err)
        }
       res.redirect('/index')
    })

    
app.get('/edit/:index',checkAuthenticated,  async (req, res) => {
    //find the item in the dbase and pass to edit page
    const editItem = await req.user.shortUrl[req.params.index]
    res.render('edit.ejs',  {urlDbase: editItem, index: req.params.index,  title:true , name:true , link:true,})
})

app.post('/update/:id',checkAuthenticated, async (req, res) => { //add url details in database
    const update = req.user.shortUrl[req.params.id]
    const nameCheck = await shortUrl.findOne({shortUrl:{$elemMatch:{name: req.body.urlName}}})
    const bodycheck1 = req.body.title  == ""
    const bodycheck2 = req.body.urlName  == ""
    const bodycheck3 = req.body.fullLink  == ""
    
    if(bodycheck1 || bodycheck2 || bodycheck3){

        res.render('edit.ejs', {urlDbase: update, index: req.params.id, title:!bodycheck1,name:!bodycheck2,link:!bodycheck3, error:req.body.urlName })
    }
    else if(nameCheck)
    {
        if(update.name == req.body.urlName)//query will still update if there are no changes in name
        {
            await shortUrl.updateOne({_id: req.user._id, "shortUrl.title": update.title, "shortUrl.name": update.name, "shortUrl.fullLink": update.fullLink },{
                $set:{"shortUrl.$.title": req.body.title, "shortUrl.$.name": req.body.urlName, "shortUrl.$.fullLink": req.body.fullLink
                }})
                

                res.redirect('/')
        }
        else
        {
                //shows name is taken if the input name is already in the database
            res.render('edit.ejs', {urlDbase: update, index: req.params.id,  title:true ,name:false ,link:true, error:req.body.urlName })
        }
   
    }else
    {
        try{
            await shortUrl.updateOne({_id: req.user._id, "shortUrl.title": update.title, "shortUrl.name": update.name, "shortUrl.fullLink": update.fullLink },{
                $set:{"shortUrl.$.title": req.body.title, "shortUrl.$.name": req.body.urlName, "shortUrl.$.fullLink": req.body.fullLink
                }})
               
                res.redirect('/')
            }      
        catch(err){
             console.log(err)
        }   
    }

    })


app.post('/login', passport.authenticate('local',{
    successRedirect: '/index',
    failureRedirect: '/',
    failureFlash: true
}))

app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/')
})

app.get('/:inputAddress', async (req, res) => { //redirect the shortlink to the url
    const address = await shortUrl.findOne({shortUrl:{$elemMatch:{name: req.params.inputAddress}}})
    if(address != null)
      {
        try{
            const link = address.shortUrl.find(({name}) => name === req.params.inputAddress)    
                if (link) {
                    return res.redirect(link.fullLink)
                    
                }
                else
                {
                    res.redirect('*')
                }
            }catch(err)
            {
                res.redirect('*')
              console.log(err)
            }
      }
    
    
    })

  
function checkAuthenticated(req,res,next){
    if(req.isAuthenticated())
    {
        return next()
    }
    res.redirect('/')
}

function checkNotAuthenticated(req,res,next){
    if(req.isAuthenticated())
    {
        return res.redirect('/index')
    }
    next()
}

app.listen(process.env.PORT || 3000)
