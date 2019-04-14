var express = require('express');
var router = express.Router();
const days = require('../db').get('days');
const moment = require('moment');

router.post('/register', function(req, res, next) {
    let error = false;

    // usa o moment para verificar a integridade das variaveis 
    // e retorna erro e altera a flag caso não passe.

    if ( !moment(req.body.day, 'DD-MM-YYYY', true).isValid()){

        res.status(400).send('The day is in the wrong format.');
        error = true;

    }else{

        if(!moment(req.body.intervals.start, 'HH:mm', true).isValid()){

            res.status(400).send('The start hour is in the wrong format.');
            error = true;

        }else{
            if(!moment(req.body.intervals.end, 'HH:mm', true).isValid()){

                res.status(400).send('The end hour is in the wrong format.'); 
                error = true;             

            }else{

                //transforma as variaveis em objeto de moment para conferir se a hora final 
                //vem depois da inicial e para usar em comparações de horario
                const start = moment(req.body.day + req.body.intervals.start, "DD/MM/YYYY HH:mm");
                const end = moment(req.body.day + req.body.intervals.end, "DD/MM/YYYY HH:mm");
                
                if ( end.isBefore(start) ){

                    res.status(400).send('Error End Time Before Start Time');
                    error =  true;
            
                }else{
                    
                    //pega os dados de intervalo a partir do dia no json
                    // e faz um for pelos intervalos de horario para
                    // comparar se tem choque de horario se sair do for
                    // sem erro ele guarda o registro antigo em uma variavel
                    // deleta todo o registro adiciona o novo horario em inteval
                    // e salva novamente.
                    // caso ele não ache o horario na pesquisa significa que é uma 
                    // nova data e gera um novo registro 

                    const data = days.find({day:req.body.day}).value();
                    
                    if(data !== undefined){
            
                        for(i=0;i<data.intervals.length;i++){
                
                            const startDB = moment(data.day + data.intervals[i].start, "DD/MM/YYYY HH:mm");
                            const endDB = moment(data.day + data.intervals[i].end, "DD/MM/YYYY HH:mm"); 
                
                            if(start.isSame(startDB)  && end.isSame(endDB) ){
                                res.status(400).send('Error There is already a record for this time');
                                error =  true;
                                break;
                            }

                            // o && !isSame é para que se o final de um por exemplo 15h o outro
                            // horario possa inicar as 15h
                            if ( start.isBetween(startDB, endDB) && !start.isSame(endDB) ) {
                                res.status(400).send('Error There is already a record for this time');
                                error =  true;
                                break;
                            }
                            
                            if ( startDB.isBetween(start, end) ) {
                                res.status(400).send('Error There is already a record for this time');
                                error =  true;
                                break;
                            }
                            
                            if ( end.isBetween(startDB, endDB) && !end.isSame(startDB)){
                                res.status(400).send('Error There is already a record for this time');
                                error =  true;
                                break;
                            }
                            
                            if ( endDB.isBetween(start, end) ) {
                                res.status(400).send('Error There is already a record for this timeError There is already a record for this timeError There is already a record for this timeError There is already a record for this timeError There is already a record for this timeError There is already a record for this timeError There is already a record for this timeError There is already a record for this timeError There is already a record for this timeError There is already a record for this time');
                                error =  true;
                                break;
                            }
                                
                        }

                        if (error === false){
                            const oldData = data;
                            days.remove(data).write(); 
                            oldData.intervals.push(req.body.intervals);      
                            days.push(oldData).write();
                            res.status(200).send('ok');
                        }
          
                    }else{
                        const newData = {
                            day: req.body.day,
                            intervals:[req.body.intervals]
                        }
                        days.push(newData).write();
                        res.status(200).send('ok');
                    }
                }

            }

        }
   
    }
    
});

router.get('/list', function(req, res, next) {

    //Verifica se tem dados para retornar
    //e retorna caso tenha ou retorna erro
    //caso não tenha

    const outData =days.value();

    if(outData.length === 0 ){

        res.status(400).send('Error no data found');

    }else{


        res.status(200).json(outData);

    }

});

router.get('/interval/:fromdate/:todate', function(req, res, next) {

    const outData = [];

    // usa o moment para verificar a integridade das variaveis 
    // e retorna erro e altera a flag caso não passe.

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
                
                //pega todos os dados do vetor no json, faz um for nesse vetor
                //transforma as variaveis em moment e compara com as que foi passada

                const data = days.value();
                
                if(data !== undefined){
        
                    for(i=0;i<data.length;i++){
                        // coloca a hora como 12:00 pq se deixar sem horas ele coloca 00:00
                        // e não entra quando o dia inicial é 00:00 e como a hora não importa
                        // nesse caso não tem problema
                        const dataDB = moment(data[i].day+'12:00', "DD/MM/YYYY HH:mm");

                        if ( dataDB.isBetween(start, end)) {
                            
                            outData.push(data[i]);
                        }


                    }
                }else{

                    res.status(400).send('Error no registered days');
                
                }
            }      
        }


    }

    if(outData.length === 0 ){

        res.status(400).send('Error no data found for this date range');

    }else{

        res.status(200).json(outData);

    }

});

router.delete('/remove/:date/:start/:end', function(req, res, next) {
let removed = false;
    // usa o moment para verificar a integridade das variaveis 
    // e retorna erro.


    if ( !moment(req.params.date, 'DD-MM-YYYY', true).isValid()){

        res.status(400).send('The day is in the wrong format.');

    }else{

        if(!moment(req.params.start, 'HH:mm', true).isValid()){

            res.status(400).send('The start hour is in the wrong format.');


        }else{
            if(!moment(req.params.end, 'HH:mm', true).isValid()){

                res.status(400).send('The end hour is in the wrong format.'); 
              

            }else{

                //procura se existe os dados para aquele dia no arquivo json.
                // caso tenha faz um for pelos intervalos se achar o intervalo
                //especifico remove ele, caso não tenha mais nenhum intervalo
                //remove o day

                const data = days.find({day: req.params.date}).value();
                const newData = data;
                if(data === undefined){
            
                    res.status(400).send('Unable to remove, data not found.');
            
                }else{
                    
                    for(i=0;i<data.intervals.length;i++){

                        if( (data.intervals[i].start===req.params.start) && (data.intervals[i].end===req.params.end) ){

                                newData.intervals.splice(i,1);

                                if(newData.intervals.length === 0){

                                    days.remove(data).write();

                                }else{

                                    days.remove(data).write();
                                    days.push(newData).write();

                                }

                                res.status(200).send('ok');
                                removed = true;

                        }


                    }

                    if (removed === false){
                        
                        res.status(400).send('Unable to remove, data not found.');

                    }
            
            
                } 

            }
        }
    }
    
  
});

router.delete('/remove/:date', function(req, res, next) {

    // usa o moment para verificar a integridade das variaveis 
    // e retorna erro.


    if ( !moment(req.params.date, 'DD-MM-YYYY', true).isValid()){

        res.status(400).send('The day is in the wrong format.');

    }else{

        //procura se existe os dados no arquivo json se sim apaga
        //e responde ok se não avisa que não encontrou dados.

        const data = days.find({day: req.params.date}).value();
            
            if(data === undefined){
            
                res.status(400).send('Unable to remove, data not found.');
            
            }else{
                    
            
                days.remove(data).write();
                res.status(200).send('ok');
            
            } 
     
    }
    
    
  
});

module.exports = router;