( function( $ ) {

	( function ( xhr ) {
		$.extend( $.support, {
			upload     : !!xhr && ( 'upload' in xhr )
			, file     : window.File && window.FileList
			,formadata : window.FormData
		} );
	} ) ( $.ajaxSettings.xhr() );

	$.upload    = $.extend( function ( url, data, callback, type ) {
		if ( ! $.support.upload || ( ! $.support.formdata && ! $.support.file ) )
				return $.error( 'HTML5 upload not supported by browser' );
		return $.ajax( {
			url           : url
			, data        : $.upload.data( data )
			, dataType    : type
			, success     : callback
			, processData : false
			, cache       : false
			, contentType : false
			, type        : 'POST'
			, beforeSend  : function ( xhr, options ) {
				var transport  = options.xhr()
					, upload   = transport.upload
					, progress = $.Callbacks( 'memory' );
				options.xhr       = function () { return transport; };
				upload.onprogress = function ( event ) {
					if ( event.lengthComputable )
						progress.fireWith( options.context || options, [ event.loaded, event.total, xhr ] );
				};
				xhr.progress      = function ( callback ) {
					progress.add( callback );
					return this;
				};
				xhr.setRequestHeader( 'Cache-Control', 'no-cache' );
			}
		} );
	}, {
		data : function ( data, filter ) {
			if ( data instanceof FormData )
				return data;
			var formData = new FormData()
				, name;
			if ( data.files instanceof FileList ) {
				name = data.name;
				data = data.files;
			}
			$.each( data, function ( key, value ) {
				if ( ! filter || filter( value, key = name || key ) !== false )
					formData.append( key, value );
			} );
			return formData;
		}
	} );

	$.fn.upload = function ( url, options ) {
		// url is optionnal
		if ( typeof url !== 'string' ) {
			options = url;
			url     = undefined;
		}
		options = $.extend( {
			//type       : *                                     // define ajax response dataType
			//, url      : http://domain.tld/path/file.ext       // define url in options
			//, addfile  : function ( file, name ) {}            // filter data + file add event handler
			//, progress : function ( loaded, total, xhr ) {}    // Ajax events as option
			//, success  : function ( response, status, xhr ) {}
			//, error    : function ( xhr, status, message ) {}
			//, complete : function ( xhr, status ) {}
		}, $.isFunction( options ) ? { success : options } : options );
		return this
			.filter( 'input[type=file]' )
			.each( function () {
				var self     = $( this )
						.on( 'addfile.upload', function ( event, data, name ) { 
							return options.addfile && options.addfile( data, name );
						} )
						.on( 'upload.upload', function () {
							var data  = $.upload.data( this, function ( data, name ) {
									return self.triggerHandler( 'addfile', [ data, name ] );
								} )
								, xhr = $.upload( url || options.url || this.form.action, data, options.success, options.type );
							$.each( events, function ( index, event ) {
									xhr[ event ]( function () {
										self.trigger( event, arguments );
									} );
							} );
						} )
					, events = [ 'progress', 'success', 'error', 'complete' ];
				$.each( events, function ( index, event ) {
						if ( $.isFunction( options[ event ] ) )
							self.on( event + '.upload', options[ event ] );
				} );
			} )
			.end();
	};

} )( jQuery );