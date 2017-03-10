/*global gdn, jQuery, Dropzone */
/**
 * ImgurUpload, a drag'n'drop image upload tool for Vanilla Forums
 * Copyright (C) 2015  James Ducker <james.ducker@gmail.com>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function ( $ ) {

	"use strict";

	// Stores Dropzone instances
	var dzs = [ ];

	// Inserts the given text at the caret position
	// in the given input or textarea el.
	var insertAtCursor = function ( el, text ) {

		var sel, startPos, endPos;

		text = text + '\n';

		//IE support
		if ( document.selection ) {

			el.focus();
			sel = document.selection.createRange();
			sel.text = text;

		} else if ( el.selectionStart || el.selectionStart == '0' ) {

			startPos = el.selectionStart;
			endPos = el.selectionEnd;
			el.value = el.value.substring(0, startPos) + text +
				el.value.substring(endPos, el.value.length);

		} else {

			el.value += text;

		}

	};

	// Returns images in appropriate markup, depending on 
	// forum settings.
	var getLinkCode = function ( data ) {

		var response, thumbnail,
			url = data.link.replace( /^http:/i, "https:" ),
			resize = ( gdn.definition("resizeimages") === "1" ),
			type = $( "#Form_Format" ).val();

		if ( resize ) {

			thumbnail = url.split( "." );
			thumbnail[ thumbnail.length - 2 ] += "h";
			thumbnail = thumbnail.join(".");

		}

		switch ( type.toLowerCase() ) {
			case "bbcode" :
				response = ( resize ? '[url=' + url + '][img]' + thumbnail + '[/img][/url]' : '[img]' + url + '[/img]' );
				break;

			case "markdown" :
				response = ( resize ? '[![](' + thumbnail + ')](' + url + ')' : '![](' + url + ')' );
				break;

			case "html" :
				// Specify width and height, so your users don't get annoyed with the page moving around as images load!
				if ( resize ) {
					response = '<a href="' + url + '" target="_new"><img src="' + thumbnail + '" alt="" /></a>';
				} else {
					response = '<img src="' + url + '" alt="" width="' + data.width + '" height="' + data.height + '" />';
				}

				break;

			default :
				response = url;
				break;

		}

		return response;

	};

	var getDropzoneConfig = function ( ta, previewCtx, clickable ) {
		return {
			sending: function ( ) {
				ta.prop( "disabled", true );
			},
			queuecomplete: function ( ) {
				ta.prop( "disabled", false );
			},
			success: function ( file, response ) {
				if ( response.success ) {
					insertAtCursor( ta[0], getLinkCode(response.data) );
				} else {
					// ultra-basic error handling
					alert( "Something went wrong trying to upload your images :( \n\nOur image host, imgur.com, may be having technical issues. Give it a few minutes and try again." );
				}
			},
			// Accept all image types
			acceptedFiles: "image/*",
			paramName: "image",
			clickable: clickable,
			method: "post",
			maxFilesize: 20,
			maxFiles: 20,
			previewsContainer: previewCtx[0],
			thumbnailWidth: 60,
			thumbnailHeight: 60,
			fallback: function ( ) { },
			url: "https://api.imgur.com/3/upload",
			headers: {
				Authorization: "Client-ID " + gdn.definition("imgurclientid"),
				Accept: "application/json"
			}
		};

	};

	var initTextarea = function ( ta ) {

		var fileInput,
			form = ta.parents( "form" ),
			dzIdx = -1,
			submitBtn = form.find( "[type=submit]" ).last(),
			previewCtx = $("<div/>", {
				"class": "imguruploader-preview-ctx"
			});

		// Don't bother doing anything if a textarea isn't found
		if ( ta.length ) {

			// Be lazy like me and just tell your users the good news, rather than
			// trying to modify the UI to make it obvious that drag'n'drop is supported.
			ta.attr( "placeholder", "You can now drag and drop images here to add them to your post! They will appear wherever your caret is." );
			ta.after( previewCtx );
			
			// Setup the dropzone
			if ( gdn.definition("enabledragdrop") === "1" ) {

				dzs.push( new Dropzone(ta[0], getDropzoneConfig(ta, previewCtx, false)) );
				dzIdx = dzs.length - 1;

			}

			// If we are dealing with a device that reports to be a touch-screen device,
			// we should show a button also, as most touch-screen devices are mobiles,
			// which don't support file drag'n'drop.
			// (This method isn't perfect but it's pretty effective, I think.)
			if ( "ontouchstart" in window || gdn.definition("showimagesbtn") === "1" ) {

				ta.attr( "placeholder", "" );
				fileInput = $( "<a href=\"#\" class=\"Button ButtonAddImages\">Add Images</a>" )
					.on( "click", function ( e ) { e.preventDefault(); });
				submitBtn.before( fileInput );
				dzs.push( new Dropzone(fileInput[0], getDropzoneConfig(ta, previewCtx, true)) );

			}

			// Clear the previews frame when the post is submitted
			submitBtn.on( "click", function ( ) {

				previewCtx.empty();

			});

			// Handle users pasting image data straight from the clipboard
			if ( dzIdx > -1 ) {

				ta.on( "paste", function ( e ) {

					var i, items = e.originalEvent.clipboardData.items;

					// Loop through items on the clipboard
					for ( i = 0; i < items.length; i++ ) {

						// Check if item is of an image type
						if ( items[i].kind === "file" && items[i].type.indexOf("image/") > -1 ) {

							// Trigger DropzoneJS's file add routine
							dzs[dzIdx].addFile( items[i].getAsFile() );

						}
					}

				});

			}

			// Do some additional magic with image links
			// Useful when users drag an image from another browser window
			// This feature can be toggled in the plugin config page.
			if ( gdn.definition("processimageurls") === "1" ) {

				ta.on( "drop", function ( e ) {

					var data = e.originalEvent.dataTransfer.getData('URL');

					if ( data.length ) {

						e.preventDefault();
						e.stopPropagation();

						if ( data.match(/([a-z\-_0-9\/\:\.]*\.(jpg|jpeg|png|gif))/i) ) {

							insertAtCursor( ta[0], getLinkCode({link: data}) );

						} else {

							// Insert plaintext
							insertAtCursor( ta[0], data );

						}

					}

				});

			}

		}

	};

	$(function ( ) {

		var ta = $( "#Form_Body" );

		initTextarea( ta );

		// Capture Vanilla's EditCommentFormLoaded event
		// And add controls to any edit boxes that are generated
		$( document ).on( "EditCommentFormLoaded", function ( ) {

			// It's possible to have multiple textareas open at once,
			// So we have to make sure to loop through all of them.
			// initTextarea takes care of not re-initialising things.
			$( ".EditCommentForm" ).find( "textarea" ).each( function ( ) {

				initTextarea( $(this) );

			});

		});

	});

}( jQuery ));