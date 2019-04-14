var express = require('express');
var router = express.Router();
const db = require('../db');
const daily = require('../db').get('daily');
const moment = require('moment');


router.post('/register', function(req, res, next) {

    // usa o moment para verificar a integridade das variaveis 
    // e retorna erro caso não passe.
  
    if(!moment(req.body.intervals.start, 'HH:mm', true).isValid()){

        res.status(400).send('The start hour is in the wrong format.');

        }else{
            if(!moment(req.body.intervals.end, 'HH:mm', true).isValid()){

                res.status(400).send('The end hour is in the wrong format.'); 
 
            }else{
                
                //pega as datas e as horas e transforma é objeto de moment para utilizar nas 
                // comparações
                const start = moment('01-03-1991'  + req.body.intervals.start, "DD-MM-YYYY HH:mm");
                const end = moment('01-03-1991' + req.body.intervals.end, "DD-MM-YYYY HH:mm");

                //verifica se horario final vem depois do inicial
                if ( end.isBefore(start) ){

                    res.status(400).send('Error End Time Before Start Time');

                }else{
                        //Adiciona a informação de horario no arquivo
                        db.set('daily',req.body).write()
                        res.status(200).send('ok').write;
                        
                }


            }

        }

});

router.get('/list', function(req, res, next) {
    //pega todos os dados do vetor no 
    //arquivo json e retorna
    const data = daily.value();

    //verifica se o objeto tem algum dado se não tiver
    //acusa erro se tiver reponde com o dado
    if(Object.keys(data).length === 0 ){

        res.status(400).send('Error no data found');

    }else{

        res.status(200).json(data);

    }

});

router.get('/interval/:fromdate/:todate', function(req, res, next) {
const outData = [];    

    //faz a verificação de integridade dos paramentros passados
    if ( !moment(req.params.fromdate, 'DD-MM-YYYY', true).isValid()){

        res.status(400).send('The fromdate is in the wrong format.');

    }else{
        if ( !moment(req.params.todate, 'DD-MM-YYYY', true).isValid()){

            res.status(400).send('The todate is in the wrong format.');
    
        }else{
            //transforma a data em moment definindo a hora inicial para 00:00 e aa final
            //para 23:59 para pegar o dia todo no intervalo.
            const start = moment(req.params.fromdate + '00:00', "DD/MM/YYYY HH:mm");
            const end = moment(req.params.todate + '23:59', "DD/MM/YYYY HH:mm");

            if ( end.isBefore(start) ){

                res.status(400).send('Error End Time Before Start Time');
        
            }else{


                const data = daily.value();
                
                //verifica se o objeto tem algum dado se sim faz um loop
                //pelo intervalo de data passada e adiciona a hora 
                //caso não tenha dado envia o erro.
                if(Object.keys(data).length !== 0){

                    let currDate = moment(start).startOf('day');
                    const lastDate = moment(end).startOf('day');
                
                    while(currDate.diff(lastDate) <= 0) {
    
    
                        if(data !== undefined){
                            
                            const obj = {
                                day: currDate.format("DD-MM-YYYY"),
                                intervals: data.intervals
                            }
                            
                            outData.push(obj);
                        }
    
                        currDate.add(1, 'days')
    
    
                    }

                    res.status(200).json(outData);

                }else{

                    res.status(400).send('Error no registered daily');
                
                }


            }
        }
    }

});

router.delete('/remove', function(req, res, next) {



        const data = daily.value();
    
        //verifica se tem algum dado no objeto que vem do banco
        //se não tiver acusa erro se tiver remove;
        if(Object.keys(data).length === 0){
    
            res.status(400).send('Unable to remove, date not found.');
    
        }else{

            db.unset('daily.intervals').write()
            res.status(200).send('ok');
    
        } 
    
  
});

module.exports = router;