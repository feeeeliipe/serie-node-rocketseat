const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('./../../config/auth.json');
const crypto = require('crypto');
const mailer = require('../../modules/mailer');

const router = express.Router();

function generateToken(params = {}) {
    // Gera o token do usuário 
    // Passa o secret que será utilizado para gerar o token 
    // e o tempo de expiração em segundos 
    const token = jwt.sign(params, authConfig.secret, {
        expiresIn: 86400
    });
    return token;
}

router.get('/getUsers', async (req, res) => {
    const users = await User.find();
    res.send(users);
})

router.post('/register', async (req, res) => {
    
    const { email } = req.body;

    try {
        
        if(await User.findOne({email})) {
            return res.status(400).json({ error: 'User already exists with this email'});
        }
        
        const user = await User.create(req.body);
        user.password = undefined;
        
        return res.send({
            user,
            token: generateToken({ id: user.id })
        });
    } catch(err) {
        res.status(400).send( { _errror: err } )
    };
    
});

router.post('/authenticate', async (req, res) => {
    const { email, password } = req.body;
    
    // Busca o usuário pelo e-mail e seleciona o campo password
    // de forma explicita, pois no model esta definido que esse campo
    // não é retornado por padrão 
    const user = await User.findOne({email}).select('+password');

    if(!user) {
        return res.status(400).send({ error: 'User not found'});    
    }

    if(!await bcrypt.compare(password, user.password)) {
        return res.status(400).send({ error: 'Invalid password'});
    }

    // Não retorna a senha criptografada 
    user.password = undefined;

    res.send({ 
        user, 
        token: generateToken({ id: user.id })
    });
    
});

router.post('/forgot_password', async (req, res) => {
    const { email } = req.body;

    if(!email) {
        return res.status(400).send({ error: 'E-mail não informado.'});
    }

    try {
        // Encontra o usuário pelo e-mail
        const user = await User.findOne({ email: email });
        if(!user) {
            return res.status(400).send({ error: 'User not found.'} );
        }
        
        // Gera um token para alteração de senha e seta e expiração para + 1 hora
        const token = crypto.randomBytes(20).toString('hex');
        const now = new Date();
        now.setHours(now.getHours() + 1);

        // Grava as informações do token e expiração no usuário 
        const updatedUser = await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now
            }
        });

        mailer.sendMail({
            to: email, 
            from: 'felipe.rinaldi.goncalves@gmail.com',
            template: 'auth/forgot_password',
            context: {
                token
            }
        }, (err) => {
            if(err) {
                return res.status(400).send({ error : 'Não foi possível enviar o e-mail' })
            }

            return res.status(204).send();
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Internal server error.' })    
    }

});

router.post('/reset_password', async (req, res) => {
    const { email, token, password } = req.body;

    try {
        const user = await User.findOne({ email })
        .select('+passwordResetToken passwordResetExpires');
        if(!user) {
            return res.status(400).send({ error: 'User not found.'} );
        }

        if(token !== user.passwordResetToken) {
            return res.status(400).send({ error: 'Invalid token'} );
        }

        const now = new Date();
        if(now > user.passwordResetExpires) {
            return res.status(400).send({ error: 'Expired token'} );
        }

        user.password = password;
        user.save();        

        return res.status(204).send();

    } catch (error) {
        return res.send(500).send({ error : 'Internal server error'});
    }
});

module.exports = (app) => {
    app.use('/auth', router);
}