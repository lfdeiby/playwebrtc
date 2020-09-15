var USER = null;

$(document).ready(function(){
    $(document).on('click', '.btnInfo', handlerInfo);
    $(document).on('click', '.btnQuiz', handlerQuiz);
    $(document).on('click', '.closeInfo', closeInfo);
    $(document).on('click', '.btnReceta', handlerReceta);
    $(document).on('click', '.btn.save', saveConclusiones);
    $(document).on('click', '#conclusiones', closeError);
    $(document).on('click', '.makeRemember', makeRemember);
    $(document).on('click', '.closePopup', closePopup);
    $(document).click(closeAllPopup);

});

function handlerInfo(){
    if( $(this).hasClass('active') == false ){
        closeInfo();

        if( USER == null ){
            if( me.type == 'coach' )
                ajaxInfoClient();
            if( me.type == 'client' )
                ajaxInfoDoctor();
        }else{
            $('#info').removeClass('hide');
        }
        $(this).addClass('active');
    }else{
        closeInfo();
    }
}

function ajaxInfoClient(){
    var url = '/sesion/api/cliente-info/'+ SIGNAL_ROOM;
    $.ajax({
        url: url,
        method: 'get',
        success: successInfoClient,
        error: errorAjax
    });
}

function errorAjax(err){
    console.log(err);
    alert("Error de conección:\nEl errror ocurrio al intentar conectarse con el servidor.\n" + err.message);
}

function successInfoClient(data){
    USER = data;
    var html = clientToHtml(data);
    $('body').append(html);
}

function ajaxInfoDoctor(){
    var url = '/sesion/api/doctor-info/'+ SIGNAL_ROOM;
    $.ajax({
        url: url,
        method: 'get',
        success: successInfoDoctor,
        error: errorAjax
    });
}

function successInfoDoctor(data){
    USER = data;
    var html = doctorToHtml(data);
    $('body').append(html);
}

function closeInfo(){
    // $('.info').remove();
    $('.info').addClass('hide');
    $('.actions button').removeClass('active');
    $('.receta').removeClass('active');
}

function handlerReceta(){
    if( $('.receta').hasClass('active') ){
        $(this).removeClass('active');
        $('.receta').removeClass('active');
    }else{
        closeInfo();
        $(this).addClass('active');
        $('.receta').addClass('active');
    }
}

function handlerQuiz(){
    if( $(this).hasClass('active') == false ){
        closeInfo();

        var quizElement = $('#quiz');
        if( $(quizElement).length ){
            $(quizElement).removeClass('hide');
        }else{
            var url = '/sesion/api/doctor-quiz/'+ SIGNAL_ROOM;
            $.ajax({
                url: url,
                type: 'get',
                success: successQuiz,
                error: errorAjax
            });
        }
        $(this).addClass('active');
    }else{
        closeInfo();
    }
}

function successQuiz(data){
    var html = quizToHtml(data);
    $('body').append(html);
}

function closeAllPopup(event){
    var target = event.target;
    if( verificarClickFueraPopup(target) ){
        $('.receta').removeClass('active');
        $('.btnReceta').removeClass('active');

        $('.info').addClass('hide');
        $('.btnInfo').removeClass('active');
    }
}

function verificarClickFueraPopup(element){
    return element.classList.contains('video') || $(element).attr('id') == 'videoRemote';
}

// PARSER OBJET TO HTML
function clientToHtml(client){
    var html = `
        <div id="info" class="info">
            <div class="header">
                <div class="name">${client.name}</div>
                <div class="text-small" style="margin-bottom:4px;">${client.place}</div>
                <div class="text-small" style="margin-bottom:4px;">
                    <b>Edad: </b> ${client.age} años
                </div>
                <div class="text-small" style="margin-bottom:4px;">
                    <b>WhatsApp: </b><a href="https://wa.me/${client.country_code}${client.phone}?text=Desde%20DocDoc,"> ${client.phone} </a> 
                </div>
                <div class="text-small" style="margin-bottom:4px;">
                    <b>Correo: </b><a href="mailto:${client.email}"> ${client.email} </a> 
                </div>
            </div>
            <div class="main">
                <div>
                    <b>Consulta: </b> ${client.consult}
                </div>
                <div>
                    <b>Síntomas: </b> ${client.sintomas}
                </div>`;
    if( client.estudio ){
        html += `
                <div>
                    <b>Laboratorio: </b> 
                    <a href="${client.estudio}" target="_blank" class="btn"> 
                        &nbsp; <span class="icon-arrow-right"></span> Ver laboratorio 
                    </a>
                </div>
        `;
    }
            
    html += `
            </div>
            <div class="main">
                <div class="form-group">
                    <b>Escriba sus conclusiones: </b>
                    <textarea id="conclusiones" rows="10">${ client.conclusion }</textarea>
                    <span id="message_concluciones"></span>
                </div>
            </div>
            <div class="footer">
                <button class="btn closeInfo" style="margin-right:15px">
                    <span class="icon-times-circle"></span> CERRAR
                </button>
                <button class="btn save">
                    <span class="icon-file-text"></span> GUARDAR
                </button>
            </div>
        </div>
    `;
    return html;
}

function doctorToHtml(doctor){
    var categories = '';
    for( var i=0; i < doctor.categories.length; i++){
        if( i != 0 ){
            categories += ',';
        }
        categories += ' ' + doctor.categories[i];
    }

    var html = `
        <div id="info" class="info">
            <div class="header">
                <img class="image" src="${doctor.picture}">
                <div class="detail">
                    <div class="name">${doctor.name}</div>
                    <div class="text-small">${doctor.speciality}</div>
                    <div class="text-small">${doctor.place}</div>
                </div>
            </div>
            <div class="main">
                <div>
                    <b> ${doctor.experience} años de experiencia profesional </b>
                </div>
                <div>
                    <b>Atiende: </b> ${ categories }
                </div>
                <div>
                    <b>Calificación: </b> ${doctor.calificacion}
                </div>`;
            
    html += `
            </div>
            <div class="footer">
                <button class="btn closeInfo">
                    <span class="icon-times-circle"></span> CERRAR
                </button>
            </div>
        </div>
    `;
    return html;
}

function saveConclusiones(){
    $(this).prop('disabled', true);
    var conclusiones = $('#conclusiones').val() || '';
    if( conclusiones.trim() !== '' ){
        saveConclucionesAjax(conclusiones);
    }else{
        $('#message_concluciones').text('Este campo es obligatorio');
        $('#message_concluciones').addClass('error');
        $(this).prop('disabled', false);
    }
}

function saveConclucionesAjax(conclusion){
    var url = '/sesion/api/save-conclusion';
    $.ajax({
        url: url,
        type: 'post',
        data: { conclusion: conclusion, room: SIGNAL_ROOM },
        success: conclusionesSuccess,
        error: errorAjax
    });
}

function conclusionesSuccess(){
    $('#message_concluciones').text('Se guardo correctamente');
    $('#message_concluciones').addClass('success'); 
}

function closeError(){
    var parent = $(this).parent();
    var message = $(parent).find('span');
    $(message).text('');
    $(message).removeClass('error');
    $(message).removeClass('success');

}

// PARSER OBJET TO HTML
function quizToHtml(quiz){
    var html = `
        <div id="quiz" class="info">
            <div class="header">
                <div class="name">Cuestionario del paciente</div>
                `;
    if( quiz.forzada ){
        /*html = `<div class="text-small" style="margin-bottom:4px;">
                    <b>Compra: </b> Forzada
                </div>`;*/
    }
                
            
        html += `
            </div>
            <div class="main">`;

    for( var i=0; i < quiz.detalle.length; i++ ){
        var item = quiz.detalle[i];
        html += `
                <div class="qz_item">
                    <span>${ item.pregunta }</span> <br>
                    <span class="answer">${ item.respuesta }</span>
                </div>
        `;
    }
            
    html += `
            </div>
            <div class="footer">
                <button class="btn closeInfo" style="margin-right:15px">
                    <span class="icon-times-circle"></span> CERRAR
                </button>
            </div>
        </div>
    `;
    return html;
}

function makeRemember(){
    INFO.hazle_recuerdo();
}

function closePopup(){
    var popupId = $(this).attr('data-popup');
    $('#' + popupId).removeClass('active');
}