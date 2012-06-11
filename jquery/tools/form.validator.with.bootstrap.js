(function( $ ){
//
//	$.tools.validator.addEffect('twbootstrap',
//
//		// show errors function
//		function(errs) {
//
//			var conf = this.getConf();
//
//			// loop errors
//			$.each(errs, function(i, err) {
//
//				// add error class
//				var input = err.input;
//				input.addClass(conf.errorClass);
//
//				// get handle to the error container
//				var msg = input.data("msg.el");
//
//				// create it if not present
//				if (!msg) {
//					msg = $(conf.message).addClass(conf.messageClass).appendTo(document.body);
//					input.data("msg.el", msg);
//				}
//
//				// clear the container
//				msg.css({visibility: 'hidden'}).find("p").remove();
//
//				// populate messages
//				$.each(err.messages, function(i, m) {
//					$("<p/>").html(m).appendTo(msg);
//				});
//
//				// make sure the width is not full body width so it can be positioned correctly
//				if (msg.outerWidth() == msg.parent().width()) {
//					msg.add(msg.find("p")).css({display: 'inline'});
//				}
//
//				// insert into correct position (relative to the field)
//				var pos = getPosition(input, msg, conf);
//
//				msg.css({ visibility: 'visible', position: 'absolute', top: pos.top, left: pos.left })
//						.fadeIn(conf.speed);
//			});
//
//
//
//		},
//
//		// hide errors function
//		function(inputs) {
//
//			var conf = this.getConf();
//			inputs.removeClass(conf.errorClass).each(function() {
//				var msg = $(this).data("msg.el");
//				if (msg) { msg.css({visibility: 'hidden'}); }
//			});
//		}
//	);
//
//	$.tools.validator.conf.effect = 'twbootstrap';


	$.tools.validator.twAddValidationMarkup = function (input, cls, twmsg) {
		var cont = input.closest('.control-group');
		cont.addClass(cls);
		input.addClass(cls);

		if (twmsg) {
			var msg = $('<span class="help-inline alert"/>');
			msg.addClass(cls);
			msg.text(twmsg);
			input.after(msg);
		}
	};

	$.tools.validator.twRemoveValidationMarkup = function (input) {

		var cont = input.closest('.control-group');
		cont.removeClass('error success warning');
		$('.help-inline.error, .help-inline.success, .help-inline.warning', cont).remove();
	}


	$.tools.validator.conf.onFail = function (e, errors) {
		$.each(errors, function () {
			var err = this;
			var input = $(err.input);
			$.tools.validator.twRemoveValidationMarkup(input);
			alert(err.messages);
			$.tools.validator.twAddValidationMarkup(input, 'error', err.messages.join(' '));
		});
		return false;
	};

	$.tools.validator.conf.onSuccess = function (e, ok) {
		$.each(ok, function () {
			var input = $(this);
			$.tools.validator.twRemoveValidationMarkup(input);
			// uncomment next line to highlight successfully
			// validated fields in green
			//$.tools.validator.twAddValidationMarkup(input, 'success');
		});
	};

	$.tools.validator.resetOrig = $.tools.validator.reset;

	$.tools.validator.reset = function(els) {
		$('.help-inline.error, .help-inline.success, .help-inline.warning', getForm()).remove();
		$('.error, .success, .warning', getForm()).removeClass('error success warning');

		$.tools.validator.resetOrig(els);
		return self;
	}


})( jQuery );