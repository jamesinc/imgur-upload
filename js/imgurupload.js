/*global gdn, jQuery */
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

		var response,
			type = gdn.definition( "InputFormat" );

		switch ( type.toLowerCase() ) {
			case "bbcode" :
				response = '[img]' + data.link + '[/img]';
				break;

			case "markdown" :
				response = '![](' + data.link + ')';
				break;

			case "html" :
				// Specify width and height, so your users don't get annoyed with the page moving around as images load!
				response = '<img src="' + data.link + '" alt="" width="' + data.width + '" height="' + data.height + '" />';
				break;

			default :
				response = data.link;
				break;

		}

		return response;

	};

	var getDropzoneConfig = function ( ta, previewCtx, clickable ) {
		return {
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

	$(function ( ) {

			// In discussions, conversations, etc, the main input is always #Form_Body,
			// but all the other IDs change, so we'll find everything relative to this element.
		var fileInput,
			ta = $( "#Form_Body" ),
			form = ta.parents( "form" ),
			submitBtn = form.find( "[type=submit]" ).last(),
			previewCtx = $("<div/>", {
				"class": "imguruploader-preview-ctx"
			});

			// Be lazy like me and just tell your users the good news, rather than
			// trying to modify the UI to make it obvious that drag'n'drop is supported.
			ta.attr( "placeholder", "You can now drag and drop images here to add them to your post! They will appear wherever your caret is." );
			ta.after( previewCtx );
			
			// Setup the dropzone
			ta.dropzone( getDropzoneConfig(ta, previewCtx, false) );

			// If we are dealing with a touch-screen device, or a device that reports to be a touch-screen device,
			// we should show a button also, as most touch-screen devices are mobiles, which don't support file drag'n'drop.
			// This method isn't perfect but it's pretty effective.
			if ( 'ontouchstart' in window ) {

				ta.attr( "placeholder", "" );
				fileInput = $( "<a href=\"#\" class=\"Button ButtonAddImages\">Add Images</a>" );
				submitBtn.before( fileInput );
				fileInput.dropzone( getDropzoneConfig(ta, previewCtx, true) );
				fileInput.on( "click", function ( e ) { e.preventDefault(); });

			}

			// Clear the previews frame when the post is submitted
			submitBtn.on( "click", function ( ) {

				previewCtx.empty();

			});

		// Do some additional magic with image links
		// Useful when users drag an image from another browser window
		// This feature can be toggled in the plugin config page.
		if ( gdn.definition("processimageurls") === "1" ) {

			ta.on( "drop", function ( e ) {

				var originalEvt = e.originalEvent,
					data = e.originalEvent.dataTransfer.getData('URL');

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

	});

}( jQuery ));