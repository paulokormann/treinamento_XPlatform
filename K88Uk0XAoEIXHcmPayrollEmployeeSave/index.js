
/**
 * Nome da primitiva : employeeSave
 * Nome do dominio : hcm
 * Nome do serviço : payroll
 * Nome do tenant : trn94657786
 **/

const axios = require('axios');

exports.handler = async event => {

    let body = parseBody(event);
    let tokenSeniorX = event.headers['X-Senior-Token'];

    const instance = axios.create({
        baseURL: 'https://platform-homologx.senior.com.br/t/senior.com.br/bridge/1.0/rest/',
        headers: {
          'Authorization': tokenSeniorX
        }
    });

     /* Não permite a troca de nome */
    if(body.sheetInitial.employee) {
        if(body.sheetInitial.person.name !== body.sheetInitial.employee.name){
            return sendRes(400,'Não é permitido alterar o nome do colaborador.'); 
        }
    }
    
    
    if(!body.sheetInitial.employee){
        // Não permitir realizar uma Admissão com o campo "Indicativo de Admissão" com o valor diferente de "Normal" 
        if(body.sheetContract.admissionOriginType.value !== 'Normal'){
             return sendRes(400,'Admitidos devem ter o Indicativo de Admissão como Normal. Verifique na aba Contrato.'); 
        }
        
         // Valida matrícula no cadastro inicial 
         if(!body.sheetContract.registernumber){
            return sendRes(400,'Informe a matrícula do colabordor (Aba Contrato).'); 
        }
    } 
        
        
     /* Valida código de Escalas para empregado */ 
     if((body.sheetInitial.contractType.key === 'Employee') && (body.sheetWorkSchedule.workshift.tableId)){
        try {
            let wshiftResp = await instance.get(`/hcm/payroll/entities/workshift/${body.sheetWorkSchedule.workshift.tableId}`);
            
            if((wshiftResp.data.code > 10) || (wshiftResp.data.workshiftType !== 'Permanent')) {
                return sendRes(400,'Escalas de empregados devem estar entre 1 e 10 e devem ser do tipo Permanente.');
            }

        } catch (error) {
            return sendRes(400,error.message);
        }
    }
   
    
    
    
    
    
    
    
    /* Valida tamanho do apelido */
    if(body.sheetPersona.nickname) {
        if(body.sheetPersona.nickname.length > 10) {
            return sendRes(400,'O apelido deve ter no máximo 10 caracteres. Verifique.');
        }
    } else {
        return sendRes(400,'O apelido deve ser informado. Verifique.');
    }

    /* Valida se a foto do colaborador está presente */
    if(!body.sheetPersona.attachment){
        return sendRes(400,'A foto do colaborador deve ser informada. Verifique.');
    } 

    /* Não permite alteração de CPF */
    if(body.sheetInitial.employee) {
        let employee = await instance.get(`/hcm/payroll/entities/employee/${body.sheetInitial.employee.tableId}`);

        if(employee.data.person.cpf !== body.sheetDocument.cpfNumber){
            return sendRes(400,'Não é permitido alterar o CPF do Colaborador.'); 
        }
    }
    
    /*Valida Campo customizado em conjunto com campo nativo*/
    if((body.sheetContract.customFieldsEmployee) && (body.sheetComplement.issueDotCard)) {
        
        let customFields = body.sheetContract.customFieldsEmployee;
        let issueDotCard = body.sheetComplement.issueDotCard;
        
        //Percorre o array de campos customizados
        for(let customField of customFields) {
            if(customField.field === 'USU_CARCON') {
                 if((customField.value === 'S') && (issueDotCard.key === 'Yes')) {
                     return sendRes(400,'Colaboradores com Cargo de Confiança não devem emitir Cartão Ponto. Verifique.');
                }
            }
        }
    }

     /* Valida Range de Escalas para Tipo de Contrato empregado */ 
     if((body.sheetInitial.contractType.key === 'Employee') && (body.sheetWorkSchedule.workshift.tableId)){
        try {
            let workshiftResponse = await instance.get(`/hcm/payroll/entities/workshift/${body.sheetWorkSchedule.workshift.tableId}`);
            
            if((workshiftResponse.data.code >= 5) && (workshiftResponse.data.code <= 10) ) {
                return sendRes(400,'Range de escala não permitido para Empregados!');
            }

        } catch (error) {
            return sendRes(400,error.message);
        }
    }

    /*Valida se o PIS informando já está em uso por outro colaborador ativo*/ 
    if(body.sheetDocument.pisNumber) {
        let nisBody = {
            numberNis: body.sheetDocument.pisNumber,
            referenceDate: body.sheetDocument.hireDate,
            personId: (body.sheetInitial.person.tableId != 'new') ? body.sheetInitial.person.tableId : null
        };
        try {
            let alreadyThisNisResponse = await instance.post('/hcm/payroll/queries/personAlreadyThisNis',nisBody);
            if(alreadyThisNisResponse.data.result.ok) {
                return sendRes(400,alreadyThisNisResponse.data.result.message);    
            } 
        } catch(error) {
            return sendRes(400,error.message);
        }
    } 
    
    /*P.Kormann - Validação do campo do campo Prenche Cota quando colaborador for deficiente */
    if((body.sheetPersona.isDisability === "true") && (body.sheetPersona.isOccupantQuota === "false")){
        return sendRes(400,'Para deficientes físicos o campo preenche cota deve ser Sim. Verifique.');
    } 

    /*Caso todas as validações passem*/
    return sendRes(200,body);
    
};



const parseBody = (event) => {
    return typeof event.body === 'string' ?  JSON.parse(event.body) : event.body || {};
};

const sendRes = (status, body) => {
    var response = {
      statusCode: status,
      headers: {
        "Content-Type": "application/json"
      },
      body: typeof body === 'string' ? body : JSON.stringify(body) 
    };
    return response;
};
