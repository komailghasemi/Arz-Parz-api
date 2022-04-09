import { Service } from "typedi";
import nodemailer from 'nodemailer'
import SMTPTransport from "nodemailer/lib/smtp-transport";

@Service({ transient: true })
export default class EmailService {

    async send(subject: string, body: string, to: string) {
       return new Promise<void>((resolve , reject) => {
        const transporter = this.getTransporter()
        
        var mailOptions = {
            from: 'all@4melk.com',
            to: to,
            subject: subject,
            html: body
        }

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              reject(error)
            } else {
              resolve()
            }
          });
       }) 
    }


    private getTransporter() {
        // return nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: process.env.EmailAddress,
        //         pass: process.env.EmailPassword
        //     }
        // });
        new SMTPTransport({})
        return nodemailer.createTransport({
            host : "4melk.com",
            port : 465,
            auth : {
                user : 'all@4melk.com',
                pass : 'ALI!@#123'
            },
            secure : true,
            tls: {
                rejectUnauthorized: false
            }
        })
    }

}