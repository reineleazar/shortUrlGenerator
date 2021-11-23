const LocalStrategy = require('passport-local').Strategy
const passport  = require('passport')
const bcrypt = require('bcrypt')
const shortUrl = require('./models/shortUrl')


    // const authenticateUser = async (email,password,done) =>
    // {  
    //     const user = getUserEmail(email)
    //     {
    //         if(user==null)
    //         {
    //             return done(null,false,{message: 'no user with that email'})
    //         }

    //         try {
    //             if(await bcrypt.compare(password,user.password)){
    //                 return done(null,user)
    //             }else{
    //                 return done(null,false,{message:'Password Incorrect'})
    //             }
    //         }catch(err){
    //             return done(err)

    //         }
    //     }
    // }
    // passport.use(new LocalStrategy(function (username, password, done) {
    //     shortUrl.findOne({ username: username })}),authenticateUser)


  module.exports = function(passport){  
    passport.use(new LocalStrategy({usernameField: 'email'},(email,password,done)=>{
        shortUrl.findOne({email:email}).then(user=>{if(!user){
            return done(null,false,{message: 'no user with that email'})
        }
        try {
                        if( bcrypt.compare(password,user.password)){
                            return done(null,user)
                        }else{
                            return done(null,false,{message:'Password Incorrect'})
                        }
                    }catch(err){
                        return done(err)
        
                    }
    })


    }))

  }  

    passport.serializeUser((user,done)=> done(null,user))
    passport.deserializeUser((Id,done)=> {
        return done(null,Id)
    })



//module.exports = initialize