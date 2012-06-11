(function( $ ){

	$.fn.bootstrapFormChangeStatus = function( status ) {

		return this.each(function() {

			$(this).closest('.control-group').removeClass('error').removeClass('warning').removeClass('success').addClass(status);

		});

	};
})( jQuery );