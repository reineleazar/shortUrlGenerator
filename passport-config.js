const LocalStrategy = require('passport-local').Strategy
const passport  = require('passport')
const bcrypt = require('bcrypt')
const shortUrl = require('./models/shortUrl')

    function initialize(passport,email,_id){
    const authenticateUser = async(email,password,done)=>{
        const user = await shortUrl.findOne({email:email})
        if(!user)
        {
            return done(null,false,{message: 'no user with that email'})
        }
        else
        { 
            try{
       
                if(await bcrypt.compare(password,user.password)){
                     return done(null,user)
                 }else{
                     return done(null,false,{message:'Password Incorrect'})
                 }}
                 catch(err){
                     return done(err)
                 }
        }
    
    }
  passport.use(new LocalStrategy({usernameField:'email'},authenticateUser))
  passport.serializeUser((user,done)=> done(null,user))
  passport.deserializeUser(function(_id, done){
  shortUrl.findById(_id, function(err,user){
      done(err,user)
  })
  })

}

module.exports = initialize