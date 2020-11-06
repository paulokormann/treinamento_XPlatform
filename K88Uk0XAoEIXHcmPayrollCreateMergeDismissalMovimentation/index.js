/**
 * Nome da primitiva : createMergeDismissalMovimentation
 * Nome do dominio : hcm
 * Nome do serviço : payroll
 * Nome do tenant : trn94657786
 **/

const axios = require('axios');

exports.handler = async event => {
  let body = parseBody(event);
  let tokenSeniorX = event.headers['X-Senior-Token'];
  let userSeniorX = event.headers['X-Senior-User'];
  
  userSeniorX = userSeniorX.split('@')[0]; //metodo padrão do JS que divide a string até o @ e pega a posição 0, que é a primeira posição
  
  const instance = axios.create({
    baseURL: 'https://platform-homologx.senior.com.br/t/senior.com.br/bridge/1.0/rest/',
    headers: {
      'Authorization': tokenSeniorX
    }
  });

  //Id do colaborador 
  let employeeId = body.employee.id;
  
  //busca informações do colaborador
  let response = await instance.get(`/hcm/payroll/entities/employee/${employeeId}`);
  
  let employee = response.data;
  
   //Verifica se está no Grupo Admin
  let userRoles = await instance.post('/platform/authorization/queries/getUserDetailRoles', { user: userSeniorX });
  
  //percorre e filtra os perfis retornando apenas os que possuem nome como admin
  userRoles = userRoles.data.roles.filter(role => {
    return role.name === 'admin';
  });
  
  /*P.Kormann - Permite cadastrar a programação de desligamento apenas se for do papel Admin*/
  if(employee.custom) {
    if((employee.custom.USU_CARCON === 'S') && (userRoles.length === 0)) {
      return sendRes(400,'Não é permitido programar desligamento para colaboradores com cargo de confiança. Verifique.');
    }
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
