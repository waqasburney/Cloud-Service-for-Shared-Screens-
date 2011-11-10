(function( $ ){

  $.fn.quiz = function( options ) {
    var settings = {
      'host'		 : 'http://localhost:3000',
      'baseUrl'		 : '/quiz/',
      'showControls'     : false,
      'showChat'	 : false,
      'showLineNumbers'  : false,
      'userName'	 : 'unnamed',
      'useMonospaceFont' : false,
      'noColors'   : 'false'
    };

    // This writes a new frame
      if ( options ) 
      { 
        $.extend( settings, options );
      }
      var epframe = this.attr('id');
      var iFrameLink = '<iframe width="'+settings.width +'" height="'+settings.height +
		'" id="epframe'+epframe+'" src="'+settings.host+settings.baseUrl+settings.quizId+'?userName=' + settings.userName+'"></iframe>';
      this.html(iFrameLink);
  };
})( jQuery );
