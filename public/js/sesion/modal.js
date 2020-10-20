var MODAL = {
	closeAll: function(){
		$('.toast').remove();
	},

	closeConnect: function(){
		$('.toast.connect').remove();
	},
 
	closeOffline: function(){
		$('.toast.offline').remove();
	},

	closeReconnect: function(){
		$('.toast.reconnect').remove();
	},

	closeShare: function(){
		$('.toast.share').remove();
	},

	connect: function(){
		var html = `<div class="toast connect">
			<div class="text">Conectando ... </div>
			<div class="alert"> <span class="rotate icon-spinner2"></span> </div>
		</div> `;

		$('body').append(html);
	},

	leaveroom: function(data){
		var user_name = data.user_name || "El usuario";
		var html = `<div class="toast">
			<div class="text">${user_name} ha abandonado la sesión</div>
			<div class="close"> <span class="icon-cancel"></span> </div>
		</div> `;

		$('body').append(html);
	},

	offline: function(){
		var html = `<div class="toast dark offline">
			<div class="text">Se ha perdido la conexión</div>
			<div class="alert"> <span class="icon-warning"></span> </div>
		</div> `;

		$('body').append(html);
	},

	openShare: function(){
		var html = `<div class="toast share">
			<div class="text">Preparando para compartir</div>
			<div class="alert"> <span class="icon-warning"></span> </div>
		</div> `;

		$('body').append(html);
	},

	trouble: function(data){
		var user_name = data.user_name || "El usuario";
		var html = `<div class="toast">
			<div class="text">${user_name} tiene problemas de conexión</div>
			<div class="close"> <span class="icon-cancel"></span> </div>
		</div> `;

		$('body').append(html);
	},

	reconnect: function(){
		var html = `<div class="toast reconnect">
			<div class="text">Intentando reconectar</div>
			<div class="alert"> <span class="rotate icon-spinner2"></span> </div>
		</div> `;

		$('body').append(html);
	},

}

$(document).ready(function(){
	$(document).on("click", ".toast", closeToast);
});

function closeToast(){
	$(this).remove();
	/*var parent = $(this).parent();
	parent.remove();*/
}