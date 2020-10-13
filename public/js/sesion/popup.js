var POPUP = {
	doctorEnter: function(){
		var html = _doctorEnter();
		$('body').append(html);
	},
	
	doctorWait: function(pacient, room){
		var html = _waitToPacient(pacient, room);
		$('body').append(html);
	},
	
	closeAll: function(){
		$('.popup').remove();
	},

	pacientWait: function(doctor, room){
		var html = _waitToDoctor(doctor, room);
		$('body').append(html);
	},

	pacientEnter: function(doctor){
		var html = _pacientEnter(doctor);
		$('body').append(html);
	},

	browserNotSupport: function(){
		var html = _browserNotSupport();
		$('body').append(html);
	}


}

$(document).ready(function(){
	$(document).on("click", ".popup .close", closePopups);
	$(document).on("click", "#enableRoom", enableRoom);

    $(document).on("click", "#startCall", handlerStartCall);

});

function closePopups(){
	var parent = $(this).parent().parent().parent().parent().parent();
	console.log(parent);
	parent.remove();
}

function _doctorEnter(){
	var html = `
		<div class="popup">
			<div class="content">
				<div class="header">
					<div class="col col2 middle">
						<div>
							<img class="logo" src="/static/img/logo.png" alt="Docdoc">
						</div>
						<div class="text-right">
							<button class="close"> <span class="icon-times-circle"></span> </button>
						</div>
					</div>
				</div>
				<div class="enableroom">
					<p><b>Bienvenido a su cita</b> <br>
					Antes de iniciar tome en cuenta lo siguiente:</p>
					<ul>
						<li>Tener una buena conexión a internet.</li>
						<li>Para dispositivos Apple, ingrese desde el navegador Safari.</li>
						<li>Para otros dispositivos ingrese desde el navegador Chrome o Firefox.</li>
					</ul>
					<p>Presione el siguiente botón para habilitar la sala de reunión con su paciente.</p>
					<br>
					<div class="text-right">
						<button id="enableRoom" class="btn success">Habilitar sala</button>
					</div>
				</div>
			</div>
		</div>
	`;
	return html;
}

function _waitToPacient(pacient, room){
	var html = `
		<div class="popup">
			<div class="content">
				<div class="header">
					<div class="col col2 middle">
						<div>
							<img class="logo" src="/static/img/logo.png" alt="Docdoc">
						</div>
						<div class="text-right">
							<button class="close"> <span class="icon-times-circle"></span> </button>
						</div>
					</div>
				</div>
				<div class="enableroom">
					<p><b>La sala esta activada</b> </p>
					<p>Esperando que se conecte: <b>${ pacient.name }</b> <br>
					<p>Puede hacerle recuerdo a través de whatsapp y enviarle el link de la sesión presionando el siguiente botón</p>
					<br>
					<div class="text-right">
						<a href="https://wa.me/${pacient.country_code}${ pacient.phone }?text=DocDoc%20te%20esperamos%20en%20la%20sesion%3A%20https%3A%2F%2Fdocdoc.net%2Fsesion%2F${ room }"
						target="_blank" class="btn success makeRemember">
							<span class="icon-whatsapp"></span>
							Hazle recuerdo
						</a>
					</div>
				</div>
			</div>
		</div>
	`;
	return html;
}

function _waitToDoctor(doctor, room){
	var html = `
		<div class="popup">
			<div class="content">
				<div class="header">
					<div class="col col2 middle">
						<div>
							<img class="logo" src="/static/img/logo.png" alt="Docdoc">
						</div>
						<div class="text-right">
							<button class="close"> <span class="icon-times-circle"></span> </button>
						</div>
					</div>
				</div>
				<div class="enableroom">
					<p><b>Bienvenido a su cita</b> <br>
					Antes de iniciar tome en cuenta lo siguiente:</p>
					<ul>
						<li>Tener una buena conexión a internet.</li>
						<li>Para dispositivos Apple, ingrese desde el navegador Safari.</li>
						<li>Para otros dispositivos ingrese desde el navegador Chrome o Firefox.</li>
					</ul>
					<p>Esperando que el doctor se conecte a la sala. Presiona en el siguiente botón para envíarle un recordatorio al doctor a través de Whatsapp.</p>
					<br>
					<div class="text-right">
						<a href="https://wa.me/${ doctor.country_code}${ other.phone }?text=DocDoc%20te%20esperamos%20en%20la%20sesion%3A%20https%3A%2F%2Fdocdoc.net%2Fsesion%2F${ room }" 
						target="_blank" class="btn success makeRemember"> 
							<span class="icon-whatsapp"></span>
							Hazle recuerdo
						</a>
					</div>
				</div>
			</div>
		</div>
	`;
	return html;
}

function _pacientEnter(doctor){
	var html = `
		<div class="popup">
			<div class="content">
				<div class="header">
					<div class="col col2 middle">
						<div>
							<img class="logo" src="/static/img/logo.png" alt="Docdoc">
						</div>
						<div class="text-right">
							<button class="close"> <span class="icon-times-circle"></span> </button>
						</div>
					</div>
				</div>
				<div class="enableroom">
					<p><b>Bienvenido a su cita</b> </p>
					<p>El doctor ${ doctor.name } te espera en la conferencia.</p>
					<p>Presione el siguiente botón para ingresar a la video conferencia.</p>
					<br>
					<div class="text-right">
						<button id="startCall" class="btn success">Entrar a la sala</button>
					</div>
				</div>
			</div>
		</div>
	`;
	return html;
}

function _browserNotSupport(){
	var html = `
		<div class="popup error">
			<div class="content">
				<div class="header">
					<div class="col col2 middle">
						<div>
							<img class="logo" src="/static/img/logo.png" alt="Docdoc">
						</div>
						<div class="text-right">
						</div>
					</div>
				</div>
				<div class="enableroom">
					<h3><b style="color:#f45a69;">Error: Lo sentimos</b> </h3>
					<p> El navegador no soporta la tecnología para la video conferencia.</p>
					<p> Por favor verifique que su conexión a internet sea estable.</p>
					<p> Actualice su navegador, o puede usar lo siguientes navegadores:</p>
					<ul>
						<li>Para dispositivos Apple, ingrese desde el navegador Safari.</li>
						<li>Para otros dispositivos ingrese desde el navegador Chrome o Firefox.</li>
					</ul>
					<br>
				</div>
			</div>
		</div>
	`;
	return html;
}