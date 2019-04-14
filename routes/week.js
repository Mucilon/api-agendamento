var express = require('express');
var router = express.Router();
const week = require('../db').get('week');
const moment = require('moment');


router.post('/register', function(req, res, next) {
    let error = false;

        // usa o momento para verificar a integridade das variaveis 
        // e retorna erro caso não passe. e altera a Flag de erro
        if(!moment(req.body.intervals.start, 'HH:mm', true).isValid()){
    
            res.status(400).send('The start hour is in the wrong format.');
            res.end();
            error = true;
    
        }else{
            if(!moment(req.body.intervals.end, 'HH:mm', true).isValid()){
    
                res.status(400).send('The end hour is in the wrong format.'); 
                error = true;             
    
            }else{

                //passa a hora comm uma data generica no moment para verificar se o final vem 
                // realmente depois do inicio e acusa o erro caso aconteça

                const start = moment("01/03/1991"  + req.body.intervals.start, "DD/MM/YYYY HH:mm");
                const end = moment("01/03/1991" + req.body.intervals.end, "DD/MM/YYYY HH:mm");
     
    
                if ( end.isBefore(start) ){
    
                    res.status(400).send('Error End Time Before Start Time');
                    error = true;
    
                }else{
                    //verifica se veio pelo menos um dado
                    //no vetor de dayofweek e retorna erro caso não
                    if(req.body.daysofweek.length === 0){
    
                        res.status(400).send('Error No have day of the week entry');
                        error = true;
    
                    }else{
                        //verifica se veio mais de 7 dados no vetor
                        // de dayofweek e retorna erro caso sim
                        if(req.body.daysofweek.length > 7){
    
                            res.status(400).send('ERROR There is a lot of input this day of the week.');
                            error = true;
        
                        }else{
                            // faz o for pelo vetor de dayofweek caso o valor de
                            // daysofweek seja acima de 7 acusa erro altera a flag
                            // e sai do for, caso não verifica se já tem o dado no
                            // arquivo se tiver apaga e atualiza se mão tiver o dado
                            // apenas escreve a nova informação
    
                            for(i=0;i<req.body.daysofweek.length;i++){
    
                                if( (req.body.daysofweek[i]<0) || (req.body.daysofweek[i]>6) ) {
    
                                    res.status(400).send('Value value of the day of the week is wrong');
                                    error = true;
                                    break;
    
                                }else{
    
                                    const data = week.find({dayofweek: req.body.daysofweek[i] }).value();
                                    if (data !== undefined){
    
                                        week.remove(data).write();
                                        week.push({
    
                                            dayofweek: req.body.daysofweek[i],
                                            intervals: req.body.intervals
                                            
                                            }).write();
                                        
                                    }else{
                            
                                        week.push({
    
    
                                            dayofweek: req.body.daysofweek[i],
                                            intervals: req.body.intervals
                                            
                                            }).write();
                                    }
                                }
                            }
                            //confere a flag se não ocorreu erro
                            //envia resposta de ok
                            if(error === false){
                                res.status(200).send('ok');
                            }
                        }
                    }
                }
    
            }
        }
        
});

router.get('/list', function(req, res, next) {

    const outData = week.value();

    if(outData.length === 0 ){

        res.status(400).send('Error no data found');

    }else{

        res.status(200).json(outData);

    }

});

router.get('/interval/:fromdate/:todate', function(req, res, next) {
   
    const outData = [];

    //faz a verificação de integridade das variaveis

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
             // pega inicio e fim e faz um while da data inicial até a final
            // no loop ele verifica se existe dados cadastrado para aquele dia da seman
            // se tiver adiciona no dado de saida.
            // depois do while conforma se tem dados para sair se tiver responde ok se não
            // informa que não tem dados



                let currDate = moment(start).startOf('day');
                const lastDate = moment(end).startOf('day');
            
                while(currDate.diff(lastDate) <= 0) {

                    const data = week.find({dayofweek: currDate.weekday()}).value();

                    if(data !== undefined){
                        
                        const obj = {
                            day: currDate.format("DD-MM-YYYY"),
                            dayofweek: currDate.weekday(),
                            intervals: data.intervals
                        }
                        
                        outData.push(obj);
                    }

                    currDate.add(1, 'days')


                }

                if(outData.length === 0){

                    res.status(400).send('Error no dates recorded for this interval')
            
                }else{

                    res.status(200).json(outData);

                }
            }
        }
    }

});

router.delete('/remove/:daysofweek', function(req, res, next) {

    let error = false;
    
    //faz o try catch para saber se fez o json parse correto,
    // e verifica todas os parametros se esta no padrão
    // depois faz o loop pelo vetor passado e remove os dados
    // que for encontrado no arquivo json

    try {
        const data = JSON.parse(req.params.daysofweek);
        const jsondata = week.value();

        if(jsondata.length === 0){
            res.status(400).send('there are no days of the week');
            error = true;
        }else{
            if( !Array.isArray(data)){
                res.status(400).send('the parameters is not array');
                error = true;
            }else{
                if(data.length > 7){
                    res.status(400).send('ERROR There is a lot of input this day of the week.');
                    error = true;
                }else{
                    if(data.length === 0){
                        res.status(400).send('Error No have day of the week entry');
                        error = true;
                    }else{
                        for(i=0;i<data.length;i++){

                            if( (data[i]<0) || (data[i]>6) ) {
                                res.status(400).send('Value value of the day of the week is wrong');
                                error = true;
                                break; 
                            }else{
                        
                                
                                const datavalue = week.find({
                                    dayofweek: parseInt(data[i])
                                }).value();
                            
                                if(datavalue !== undefined){
                            
                                    week.remove(datavalue).write();
                            
                                }
                        
                            }

                        }
                        if(error === false){
                            res.status(200).send('ok');
                        }

                    }


                }
            }
        }    
    }    
    catch (e) {
        if (e instanceof SyntaxError) {
            res.status(400).send(e.message );
        } else {
            res.status(400).send(e.message );
        }
    }
});

module.exports = router;