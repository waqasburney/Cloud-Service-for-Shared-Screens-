(function( $ ){

  $.fn.pad = function( options ) {
    var settings = {
      'host'		 : 'http://localhost:9001',
      'baseUrl'		 : '/p/',
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
	'" id="epframe'+epframe+'" src="'+settings.host+settings.baseUrl+settings.padId+'?showControls='+settings.showControls+'&showChat='+settings.showChat+'&showLineNumbers='+settings.showLineNumbers+'&useMonospaceFont='+settings.useMonospaceFont+'&userName=' + settings.userName + '&noColors=' + settings.noColors + '"></iframe>';
     this.html(iFrameLink);
  };
})( jQuery );
