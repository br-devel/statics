CKEDITOR.plugins.add( 'charcount', {
   init : function( editor ) {
      var defaultLimit = 'unlimited';
      var defaultFormat = '%count% / %limit%';
      var limit = defaultLimit;
      var format = defaultFormat;

      var intervalId;
      var lastCount = 0;
      var limitReachedNotified = false;
      var limitRestoredNotified = false;
      
      if(true) {   
         function counterId(editor) {
            return editor.name+'_counter';
         }
         
         function counterElement(editor) {
            return document.getElementById( counterId(editor) );
         }
         
         function updateCounter(editor) {
            var count = editor.getData().replace(/(<([^>]+)>)/ig, '').length;
            //if( count == lastCount && count != 0){
            //   return true;
            //} else {
            //   lastCount = count;
            //}
            
            var html = format.replace('%count%', count).replace('%limit%', limit);
            counterElement(editor).innerHTML = html;
            
            if(count > limit){
                limitReached(editor);
            }
         }
         
         function limitReached(editor) {
            $('#'+counterId(editor)+' .cke_charcount_count').css('color','red');
            //editor.execCommand('undo');
         }
         
         function limitRestored(editor) {}

         /*
         editor.on( 'themeSpace', function(event) {
            if(event.data.space == 'bottom'){
               event.data.html += '<div id="'+counterId(event.editor)+'" class="cke_charcount"' +
                  ' title="' + CKEDITOR.tools.htmlEncode('Character Counter') + '"' +
                  '>&nbsp;</div>';
            }
         }, editor, null, 100);
         */
         editor.on('instanceReady', function(event) {
            if(editor.config.charcount_limit != undefined) {
               limit = editor.config.charcount_limit;
            }
            if(editor.config.charcount_format != undefined) {
               format = editor.config.charcount_format;
            }
            
         }, editor, null, 100);
         
         editor.on('dataReady', function(event) {
            var count = event.editor.getData().replace(/(<([^>]+)>)/ig, '').length;
            if(count > limit){
               limitReached(editor);
            }
            updateCounter(event.editor);
         }, editor, null, 100);
         
         editor.on('key', function(event) {
            updateCounter(event.editor);
         }, editor, null, 100);
         
         editor.on('focus', function(event) {
            editorHasFocus = true;
         }, editor, null, 100);
         
         editor.on('blur', function(event) {
            editorHasFocus = false;
         }, editor, null, 100);
      }
   }
});