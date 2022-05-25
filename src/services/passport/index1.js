import passport from 'passport'
import { Schema } from 'bodymen'
import { BasicStrategy } from 'passport-http'
import { Strategy as BearerStrategy } from 'passport-http-bearer'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { jwtSecret, masterKey } from '../../config'
import User, { schema } from '../../api/user/model'
import {WRONG_USER,MISSING_FIELDS,UNAUTH} from '../../constants/constants'
 
export const password = () => async(req, res, next) =>
  passport.authenticate('password', { session: false }, async(err, user, info) => {
    if (!user && req.body) {
      if (req.body.login) {
        let bodyData = Buffer.from(req.body.login, 'base64');
        let bodyDetails = bodyData.toString('ascii');
        let loginDetails = JSON.parse(bodyDetails);
        let email = loginDetails.email, password = loginDetails.password;
        const userSchema = new Schema({ email: schema.tree.email, password: schema.tree.password });
        userSchema.validate({ email, password }, (err) => {
          if (err) return res.status(401).json({ message: err.message });
        })
        user = await User.findOne({ email: email }).then((userObject) => {
          if (!userObject) {
            return res.status(401).json({message:WRONG_USER}).end()          
          }
          return userObject.authenticate(password, userObject.password).then((userDetail) => {
            if(userDetail){
              return userDetail;
            }
          }).catch((error) => { return res.status(401).json({message:error.message}).end() })
        });        
      } else {
        return res.status(400).json({message:MISSING_FIELDS,error:err})
      }
    }
    if (err && err.param) {
      return res.status(400).json({message:MISSING_FIELDS,error:err})
    } else if (err || !user) {
      return res.status(401).json({message:WRONG_USER}).end()
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) return res.status(401).json({message:UNAUTH}).end()
      next()
    })
  })(req, res, next)

export const otp = () => (req, res, next) =>
  passport.authenticate('otp', { session: false }, (err, user, info) => {
    if (err && err.param) {
      return res.status(400).json({message:MISSING_FIELDS,error:err})
    } else if (err || !user) {
      return res.status(401).json({message:UNAUTH}).end()
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) return res.status(401).json({message:UNAUTH}).end()
      next()
    })
  })(req, res, next)  

export const otpVerification = () => async(req, res, next) => {
  //console.log('req', req.user);
  passport.authenticate('otp', { session: false }, async(err, user, info) => {
    //console.log('user', user);
    //console.log('err', err);
    if (!user && req.body) {
      if (req.body.login) {
        let bodyData = Buffer.from(req.body.login, 'base64');
        let bodyDetails = bodyData.toString('ascii');
        let loginDetails = JSON.parse(bodyDetails);
        //console.log('loginDetails', loginDetails);
        let email = loginDetails.email, otp = loginDetails.otp;
        const userSchema = new Schema({ email: schema.tree.email, otp: schema.tree.otp });
        userSchema.validate({ email, otp }, (err) => {
          if (err) return res.status(401).json({ message: err.message });
        })
        user = await User.findOne({ email: email }).then((userObject) => {
          if (!userObject) {
            return res.status(401).json({message:WRONG_USER}).end()
          } else {
            if (userObject.otp == otp) {
              return true;
            } else {
              return res.status(401).json({message:WRONG_USER}).end()
            }
          }
        });        
      } else {
        return res.status(400).json({message:MISSING_FIELDS,error:err})
      }  
    }
    if (err && err.param) {
      return res.status(400).json({message:MISSING_FIELDS,error:err})
    } else if (err || !user) {
      return res.status(401).json({message:UNAUTH}).end()
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) return res.status(401).json({message:UNAUTH}).end()
      next()
    })
  })(req, res, next)
}

export const master = () =>
  passport.authenticate('master', { session: false })

export const token = ({ required, roles = User.roles } = {}) => (req, res, next) =>
  passport.authenticate('token', { session: false }, (err, user, info) => {
    if (err || (required && !user) || (required && !~roles.indexOf(user.role))) {
      return res.status(401).json({message:UNAUTH}).end()
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) return res.status(401).json({message:UNAUTH}).end()
      next()
    })
  })(req, res, next)

passport.use('password', new BasicStrategy((email, password, done) => {
  const userSchema = new Schema({ email: schema.tree.email, password: schema.tree.password })

  userSchema.validate({ email, password }, (err) => {
    if (err) done(err)
  })

  User.findOne({ email }).populate('roleId').then((user) => {
    if (!user) {
      done(true)
      return null
      
    }
    return user.authenticate(password, user.password).then((user) => {
      done(null, user)
      return null
    }).catch(done)
  })
}))

passport.use('otp', new BearerStrategy((email, otp, done) => {
  //console.log('email', email);
  //console.log('otp', otp);
  const userSchema = new Schema({ email: schema.tree.email, otp: schema.tree.otp })

  userSchema.validate({ email, otp }, (err) => {
    if (err) done(err)
  })

  User.findOne({ email, otp }).then((user) => {
    if (!user) {
      done(true)
      return null
    }
    done(null, user);
    ////console.log(user.authenticateOtp(email, otp));
    // return user.authenticateOtp(email, otp) ? done(null, user):done(null, null);
  })
}))

passport.use('master', new BearerStrategy((token, done) => {
  if (token === masterKey) {
    done(null, {})
  } else {
    done(null, false)
  }
}))

passport.use('token', new JwtStrategy({
  secretOrKey: jwtSecret,
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromUrlQueryParameter('access_token'),
    ExtractJwt.fromBodyField('access_token'),
    ExtractJwt.fromAuthHeaderWithScheme('Bearer')
  ])
}, ({ id }, done) => {
  User.findById(id).then((user) => {
    done(null, user)
    return null
  }).catch(done)
}))
