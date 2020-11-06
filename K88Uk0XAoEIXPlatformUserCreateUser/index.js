
/**
 * Nome da primitiva : createUser
 * Nome do dominio : platform
 * Nome do serviço : user
 * Nome do tenant : trn94657786
 **/

exports.handler = async (event) => {
    return sendRes(200, JSON.parse(event.body));
};

const sendRes = (status, body) => {
  
  if(body.username.toUpperCase() == 'TESTE'){
    const response = {
      statusCode: 417,
      body: "Não é permitido criar um usuário com nome Teste."
    }
    return response;
  } else {
    var response = {
      statusCode: status,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    };
  
    return response;
  }
};
