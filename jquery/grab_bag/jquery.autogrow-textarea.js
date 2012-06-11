//Modified by eturino 20100426: uses maxHeight
(function($) {

    /*
     * Auto-growing textareas; technique ripped from Facebook
     */
    $.fn.autogrow = function(options) {
        this.filter('textarea').each(function() {
            var $this       = $(this),
                minHeight   = $this.height(),
                lineHeight  = $this.css('lineHeight'),
            	maxHeight	= options.maxHeight;

			//eturino: modificamos para que se aplique correctamente minHeight
			if(options.minHeight){
				minHeight = Math.max(options.minHeight, minHeight);
			}

            var shadow = $('<div></div>').css({
                position:   'absolute',
                top:        -10000,
                left:       -10000,
                width:      $(this).width() - parseInt($this.css('paddingLeft')) - parseInt($this.css('paddingRight')),
                fontSize:   $this.css('fontSize'),
                fontFamily: $this.css('fontFamily'),
                lineHeight: $this.css('lineHeight'),
                resize:     'none'
            }).appendTo(document.body);
            
            var update = function() {
    
                var times = function(string, number) {
                    for (var i = 0, r = ''; i < number; i ++) r += string;
                    return r;
                };
                
                var val = this.value.replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;')
                                    .replace(/&/g, '&amp;')
                                    .replace(/\n$/, '<br/>&nbsp;')
                                    .replace(/\n/g, '<br/>')
                                    .replace(/ {2,}/g, function(space) { return times('&nbsp;', space.length -1) + ' '; });
                
                shadow.html(val);
                var nHeight = Math.max(shadow.height() + 20, minHeight);
                if(maxHeight > 0){
                	nHeight = Math.min(nHeight, maxHeight);
                }
                $(this).css('height', nHeight);
            
            };
            
            $(this).change(update).keyup(update).keydown(update);
            
            update.apply(this);
            
        });
        
        return this;
        
    };
    
})(jQuery);
