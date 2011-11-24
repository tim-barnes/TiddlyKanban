/***
|''Name''|TiddlyKanban|
|''Description''|Renders tiddlers into a KANBAN and allows editing by drag-and-drop.|
|''Maintainer''|Tim Barnes|
|''Version''|0.9.1|
|''Status''|stable|
|''Source''|[[https://github.com/tim-barnes/TiddlyKanban]]|
|''License''|[[http://creativecommons.org/licenses/by-sa/3.0/]]|
|''~CoreVersion''|2.5.0|
|''Feedback''|[[TiddlyWiki community|http://groups.google.com/group/TiddlyWiki]] |
|''Keywords''|kanban|
!Usage
{{{
<<kanban columncatagory1 columncatagory2 ...>>
}}}
Each {{{columncatagory}}} becomes a column in the kanban table.  Tiddlers tagged with {{{columncatagory}}} will be displayed as work cards in the column.
Each work card contains a link to the source tiddler and cards can be dragged and dropped between columns.
!!Examples
{{{<<kanban Backlog WIP Testing Complete>>}}}
will create and display a 4 column kanban.
!!Customising
Layout, colours and display of the kanban can be adjust by editing the StyleSheetKanbanPlugin shadow tiddler.
!Acknowledgements
TiddlyKanban was originally inspired by Stephan Schmidt's single page kanban ([[www.simple-kanban.com]]).
This plugin would not be possible without the excellent dragsort ([[http://dragsort.codeplex.com/]]) jQuery plugin.  
!Changelog
!!v0.9 (2011-11-20)
* initial release
!!v0.9.1 (2011-11-24)
* Fixed bug in dragsort that failed to recognise changes between lists.
* Fixed issue with autoupdate of tiddlers with whitespace in the title.
!TODO
* Work card colours
* Work card tracking
* min/max button for each tiddler, and a whole column min/max function
* vertical size limit of work items
* direct drop of links into kanban columns?
* Saving position of tiddlers
* Create static copy of current kanban in new tiddler.
* Wild card columns
* Field based columns
* Persist column order
* Sort columns on tiddler modified date, field value?
!Known Issues / bugs
* --Autoupdate does not work for tiddlers with spaces in the titles.--
* --Tiddler does not always get updated on blank columns - broken itemDrop?--
* Default CSS does not obey local stylesheet conventions - particularly container div height.
* Need to auto include [[StyleSheetKanbanPlugin]] into the [[StyleSheet]] tiddler.
!Code
***/
//{{{
/*
!StyleSheet

.kanbantable {
	float:none;
	clear:both;
	display:block;
}

.kanbancolumndiv	{
	float:left;
	display:inline;
	margin: 0em 0em 0em 0.5em; 
}

.kanbancolumn {
	list-style: none; 
	margin: 0;
	padding: 0;
}
	
.kanbancolumnheader { 
	font-weight: bold; 
	height: 3em; 
	background-color: #e0e0e0; 
	color: #a0a0a0;
	border: 1px solid black; 
	align: center;
}

.kanbannewlink {
	align: right;
	color: #0000F0;
}

.kanbanworkitem { 
	font-size: 80%; 
	border: 1px solid black; 
	background-color: #e0ffe0; 
 	margin: 0.5em 0em 0.5em 0em;
}

!Code
*/
	
//Install the plugin
if(!version.extensions.TiddlyKanban) {
    version.extensions.TiddlyKanban = {installed:true};

// jQuery List DragSort v0.4
// Website: http://dragsort.codeplex.com/
// License: http://dragsort.codeplex.com/license
// Includes bugfix by Tim Barnes 24-Nov-2011
(function($) {

	$.fn.dragsort = function(options) {
		var opts = $.extend({}, $.fn.dragsort.defaults, options);
		var lists = [];
		var list = null, lastPos = null;
		if (this.selector)
			$("head").append("<style type='text/css'>" + (this.selector.split(",").join(" " + opts.dragSelector + ",") + " " + opts.dragSelector) + " { cursor: pointer; }</style>");

		this.each(function(i, cont) {

			if ($(cont).is("table") && $(cont).children().size() == 1 && $(cont).children().is("tbody"))
				cont = $(cont).children().get(0);

			var newList = {
				draggedItem: null,
				placeHolderItem: null,
				pos: null,
				offset: null,
				offsetLimit: null,
				scroll: null,
				container: cont,

				init: function() {
					$(this.container).attr("data-listIdx", i).mousedown(this.grabItem).find(opts.dragSelector).css("cursor", "pointer");
					$(this.container).children(opts.itemSelector).each(function(j) { $(this).attr("data-itemIdx", j); $(this).attr("data-parentIdx", i); });
				},

				grabItem: function(e) {
					if (e.which != 1 || $(e.target).is(opts.dragSelectorExclude))
						return;

					var elm = e.target;
					while (!$(elm).is("[data-listIdx='" + $(this).attr("data-listIdx") + "'] " + opts.dragSelector)) {
						if (elm == this) return;
						elm = elm.parentNode;
					}

					if (list != null && list.draggedItem != null)
						list.dropItem();

					$(e.target).css("cursor", "move");

					list = lists[$(this).attr("data-listIdx")];
					list.draggedItem = $(elm).closest(opts.itemSelector);
					var mt = parseInt(list.draggedItem.css("marginTop"));
					var ml = parseInt(list.draggedItem.css("marginLeft"));
					list.offset = list.draggedItem.offset();
					list.offset.top = e.pageY - list.offset.top + (isNaN(mt) ? 0 : mt) - 1;
					list.offset.left = e.pageX - list.offset.left + (isNaN(ml) ? 0 : ml) - 1;

					if (!opts.dragBetween) {
						var containerHeight = $(list.container).outerHeight() == 0 ? Math.max(1, Math.round(0.5 + $(list.container).children(opts.itemSelector).size() * list.draggedItem.outerWidth() / $(list.container).outerWidth())) * list.draggedItem.outerHeight() : $(list.container).outerHeight();
						list.offsetLimit = $(list.container).offset();
						list.offsetLimit.right = list.offsetLimit.left + $(list.container).outerWidth() - list.draggedItem.outerWidth();
						list.offsetLimit.bottom = list.offsetLimit.top + containerHeight - list.draggedItem.outerHeight();
					}

					var h = list.draggedItem.height();
					var w = list.draggedItem.width();
					var orig = list.draggedItem.attr("style");
					list.draggedItem.attr("data-origStyle", orig ? orig : "");
					if (opts.itemSelector == "tr") {
						list.draggedItem.children().each(function() { $(this).width($(this).width()); });
						list.placeHolderItem = list.draggedItem.clone().attr("data-placeHolder", true);
						list.draggedItem.after(list.placeHolderItem);
						list.placeHolderItem.children().each(function() { $(this).css({ borderWidth:0, width: $(this).width() + 1, height: $(this).height() + 1 }).html("&nbsp;"); });
					} else {
						list.draggedItem.after(opts.placeHolderTemplate);
						list.placeHolderItem = list.draggedItem.next().css({ height: h, width: w }).attr("data-placeHolder", true);
					}
					list.draggedItem.css({ position: "absolute", opacity: 0.8, "z-index": 999, height: h, width: w });

					$(lists).each(function(i, l) { l.createDropTargets(); l.buildPositionTable(); });

					list.scroll = { moveX: 0, moveY: 0, maxX: $(document).width() - $(window).width(), maxY: $(document).height() - $(window).height() };
					list.scroll.scrollY = window.setInterval(function() {
						if (opts.scrollContainer != window) {
							$(opts.scrollContainer).scrollTop($(opts.scrollContainer).scrollTop() + list.scroll.moveY);
							return;
						}
						var t = $(opts.scrollContainer).scrollTop();
						if (list.scroll.moveY > 0 && t < list.scroll.maxY || list.scroll.moveY < 0 && t > 0) {
							$(opts.scrollContainer).scrollTop(t + list.scroll.moveY);
							list.draggedItem.css("top", list.draggedItem.offset().top + list.scroll.moveY + 1);
						}
					}, 10);
					list.scroll.scrollX = window.setInterval(function() {
						if (opts.scrollContainer != window) {
							$(opts.scrollContainer).scrollLeft($(opts.scrollContainer).scrollLeft() + list.scroll.moveX);
							return;
						}
						var l = $(opts.scrollContainer).scrollLeft();
						if (list.scroll.moveX > 0 && l < list.scroll.maxX || list.scroll.moveX < 0 && l > 0) {
							$(opts.scrollContainer).scrollLeft(l + list.scroll.moveX);
							list.draggedItem.css("left", list.draggedItem.offset().left + list.scroll.moveX + 1);
						}
					}, 10);

					list.setPos(e.pageX, e.pageY);
					$(document).bind("selectstart", list.stopBubble); //stop ie text selection
					$(document).bind("mousemove", list.swapItems);
					$(document).bind("mouseup", list.dropItem);
					if (opts.scrollContainer != window)
						$(window).bind("DOMMouseScroll mousewheel", list.wheel);
					return false; //stop moz text selection
				},

				setPos: function(x, y) {
					var top = y - this.offset.top;
					var left = x - this.offset.left;

					if (!opts.dragBetween) {
						top = Math.min(this.offsetLimit.bottom, Math.max(top, this.offsetLimit.top));
						left = Math.min(this.offsetLimit.right, Math.max(left, this.offsetLimit.left));
					}

					this.draggedItem.parents().each(function() {
						if ($(this).css("position") != "static" && (!$.browser.mozilla || $(this).css("display") != "table")) {
							var offset = $(this).offset();
							top -= offset.top;
							left -= offset.left;
							return false;
						}
					});

					if (opts.scrollContainer == window) {
						y -= $(window).scrollTop();
						x -= $(window).scrollLeft();
						y = Math.max(0, y - $(window).height() + 5) + Math.min(0, y - 5);
						x = Math.max(0, x - $(window).width() + 5) + Math.min(0, x - 5);
					} else {
						var cont = $(opts.scrollContainer);
						var offset = cont.offset();
						y = Math.max(0, y - cont.height() - offset.top) + Math.min(0, y - offset.top);
						x = Math.max(0, x - cont.width() - offset.left) + Math.min(0, x - offset.left);
					}
					
					list.scroll.moveX = x == 0 ? 0 : x * opts.scrollSpeed / Math.abs(x);
					list.scroll.moveY = y == 0 ? 0 : y * opts.scrollSpeed / Math.abs(y);

					this.draggedItem.css({ top: top, left: left });
				},
				
				wheel: function(e) {
					if (($.browser.safari || $.browser.mozilla) && list && opts.scrollContainer != window) {
						var cont = $(opts.scrollContainer);
						var offset = cont.offset();
						if (e.pageX > offset.left && e.pageX < offset.left + cont.width() && e.pageY > offset.top && e.pageY < offset.top + cont.height()) {
							var delta = e.detail ? e.detail * 5 : e.wheelDelta / -2;
							cont.scrollTop(cont.scrollTop() + delta);
							e.preventDefault();
						}
					}
				},

				buildPositionTable: function() {
					var item = this.draggedItem == null ? null : this.draggedItem.get(0);
					var pos = [];
					$(this.container).children(opts.itemSelector).each(function(i, elm) {
						if (elm != item) {
							var loc = $(elm).offset();
							loc.right = loc.left + $(elm).width();
							loc.bottom = loc.top + $(elm).height();
							loc.elm = elm;
							pos.push(loc);
						}
					});
					this.pos = pos;
				},

				dropItem: function() {
					if (list.draggedItem == null)
						return;

					$(list.container).find(opts.dragSelector).css("cursor", "pointer");
					list.placeHolderItem.before(list.draggedItem);

					//list.draggedItem.attr("style", "") doesn't work on IE8 and jQuery 1.5 or lower
					//list.draggedItem.removeAttr("style") doesn't work on chrome and jQuery 1.6 (works jQuery 1.5 or lower)
					var orig = list.draggedItem.attr("data-origStyle");
					list.draggedItem.attr("style", orig);
					if (orig == "")
						list.draggedItem.removeAttr("style");
					list.draggedItem.removeAttr("data-origStyle");
					list.placeHolderItem.remove();

					$("[data-dropTarget]").remove();

					window.clearInterval(list.scroll.scrollY);
					window.clearInterval(list.scroll.scrollX);

					var changed = false;
					$(lists).each(function(i) {
						$(this.container).children(opts.itemSelector).each(function(j) {
							if (parseInt($(this).attr("data-parentIdx")) != i) {
								changed = true;
								$(this).attr("data-parentIdx", i);
							}
							
							if (parseInt($(this).attr("data-itemIdx")) != j) {
								changed = true;
								$(this).attr("data-itemIdx", j);
							}
						});
					});
					if (changed)
						opts.dragEnd.apply(list.draggedItem);
					list.draggedItem = null;
					$(document).unbind("selectstart", list.stopBubble);
					$(document).unbind("mousemove", list.swapItems);
					$(document).unbind("mouseup", list.dropItem);
					if (opts.scrollContainer != window)
						$(window).unbind("DOMMouseScroll mousewheel", list.wheel);
					return false;
				},

				stopBubble: function() { return false; },

				swapItems: function(e) {
					if (list.draggedItem == null)
						return false;

					list.setPos(e.pageX, e.pageY);

					var ei = list.findPos(e.pageX, e.pageY);
					var nlist = list;
					for (var i = 0; ei == -1 && opts.dragBetween && i < lists.length; i++) {
						ei = lists[i].findPos(e.pageX, e.pageY);
						nlist = lists[i];
					}

					if (ei == -1 || $(nlist.pos[ei].elm).attr("data-placeHolder"))
						return false;

					if (lastPos == null || lastPos.top > list.draggedItem.offset().top || lastPos.left > list.draggedItem.offset().left)
						$(nlist.pos[ei].elm).before(list.placeHolderItem);
					else
						$(nlist.pos[ei].elm).after(list.placeHolderItem);

					$(lists).each(function(i, l) { l.createDropTargets(); l.buildPositionTable(); });
					lastPos = list.draggedItem.offset();
					return false;
				},

				findPos: function(x, y) {
					for (var i = 0; i < this.pos.length; i++) {
						if (this.pos[i].left < x && this.pos[i].right > x && this.pos[i].top < y && this.pos[i].bottom > y)
							return i;
					}
					return -1;
				},

				createDropTargets: function() {
					if (!opts.dragBetween)
						return;

					$(lists).each(function() {
						var ph = $(this.container).find("[data-placeHolder]");
						var dt = $(this.container).find("[data-dropTarget]");
						if (ph.size() > 0 && dt.size() > 0)
							dt.remove();
						else if (ph.size() == 0 && dt.size() == 0) {
							//list.placeHolderItem.clone().removeAttr("data-placeHolder") crashes in IE7 and jquery 1.5.1 (doesn't in jquery 1.4.2 or IE8)
							$(this.container).append(list.placeHolderItem.removeAttr("data-placeHolder").clone().attr("data-dropTarget", true));
							list.placeHolderItem.attr("data-placeHolder", true);
						}
					});
				}
			};

			newList.init();
			lists.push(newList);
		});

		return this;
	};

	$.fn.dragsort.defaults = {
		itemSelector: "li",
		dragSelector: "li",
		dragSelectorExclude: "input, textarea, a[href]",
		dragEnd: function() { },
		dragBetween: false,
		placeHolderTemplate: "<li>&nbsp;</li>",
		scrollContainer: window,
		scrollSpeed: 5
	};

})(jQuery);
	//End of dragsort code
	
    //--
    //-- Kanban Macro
    //--
    config.macros.kanban = {
    	init: function() {
			//Install the StyleSheetKanbanPlugin shadow tiddler
			var name = "StyleSheet" + tiddler.title;
			config.shadowTiddlers[name] = "/*{{{*/\n%0\n/*}}}*/".
			    format(store.getTiddlerText(tiddler.title + "##StyleSheet")); 
	
	        var style = store.getTiddlerText(name);
	        if (style) {
	            setStylesheet(style, name);
	        }
    		
    		//Add the update notification
    		store.addNotification(null, config.macros.kanban.tiddler_changed);
    	},
    	
   		handler: function(place,macroName,params)
	    {
	    	//Guard against recursive kanbans....
	    	if (jQuery(place).closest(".kanbantable").length > 0) {
	    		createTiddlyError(place,"KanbanPlugin","Kanbans cannot be embedded in other kanbans!");
	    		return;
	    	}
	    	
	    	//Create the kanban
	    	var states = params;
	    	var table = createTiddlyElement(place, 'span', null, 'kanbantable', null);
			var ids = "";
			var width = (100 / states.length) - 1.5;
					
			for (j=0; j< states.length; j++) {
				var state = states[j];
				
				var stateDiv = createTiddlyElement(table, 'div', null, 'kanbancolumndiv', null);
				jQuery(stateDiv).css('width', width + "%");
				
				var header = createTiddlyElement(stateDiv, 'div', null, 'kanbancolumnheader', state);
				var column = createTiddlyElement(stateDiv, 'div', null, 'kanbancolumn', null);
				jQuery(column).attr("kanbanstate", state);
											
				var tiddlers = store.getTaggedTiddlers(state);
				
				ids += ".kanbancolumn[kanbanstate=" + state + "],";
				
				for (k = 0; k < tiddlers.length; k++) {
					this.create_workitem(tiddlers[k], column, state);
				}
				
				//Create a new tiddler link at the base of each Kanban column
				var newLink = "<<newTiddler tag:%0>>".format(state);
				wikify(newLink, stateDiv);				
			}
			
			//Enable drag and drop between columns
			jQuery(ids, table).dragsort({ 
				dragSelector: ".kanbanworkitem",
				dragBetween: true, 
				dragEnd: config.macros.kanban.itemDrop
				});
	    },
	    
	    //--
		//-- Renders a tiddler into a work item
		//--
		render_workitem: function(tiddler, cell)
		{
			//Render the tiddler to the cell
			wikify('[[' + tiddler.title + ']]', cell);
			wikify('----',cell)
			wikify(tiddler.text, cell);
		},
		
		//--
		//-- Creates the work item element
		//--
		create_workitem: function(tiddler, column, state)
		{
			//Create the cell
			var cell = createTiddlyElement(column, 'li', null, 'kanbanworkitem', null);
			
			jQuery(cell).attr("kanbanstate", state);
			jQuery(cell).attr("kanbanid", tiddler.title);
			
			this.render_workitem(tiddler, cell);
		},
	    
	    //--
		//-- Called on drop from the dragsort function
		//--
		itemDrop: function()
		{	
			try {
				var id = this.attr('kanbanid');
				var newParent = this.parent().attr('kanbanstate');
				
				//Get the tiddler from the store
				var tiddler = store.getTiddler(id);
				if (tiddler)
				{
					var oldTag = this.attr('kanbanstate');
					
					var tagIdx = tiddler.tags.indexOf(oldTag);
					tiddler.tags[tagIdx] = newParent;
					this.attr('kanbanstate', newParent);
					
					//Ensure the tiddler is saved
					tiddler.incChangeCount();
					tiddler.saveToDiv();
					store.setDirty(id, true);
					
					if (config.options.chkAutoSave == true)
					{
						saveChanges();
					}
					
					//Update all the kanbans
					config.macros.kanban.tiddler_changed(id);
				} else {
					//Error case
					alert("Something is wrong here: " + id + " could not be retrieved from the tiddler store!");
				}
			} 
        	catch(ex) {
        		pluginInfo.log.push("Exception thrown when updating tiddler: " + tiddlerTitle + "\nException was:  " + ex.name + "\n" + ex.message);
        	}
		},
		
		//--
        //-- Notification and change handler
        //--
        tiddler_changed: function(tiddlerTitle)
        {
        	try {
	         	var tiddler = store.getTiddler(tiddlerTitle);
	        	if (tiddler)
	        	{
	        		jQuery(".kanbancolumn").each(function (index) {
        				var state = jQuery(this).attr("kanbanstate");
        				
        				//Get all the matching workitems for this column
        				var workItems = jQuery(this).children(".kanbanworkitem[kanbanid=\"" + tiddlerTitle + "\"]");
        				
        				if (tiddler.isTagged(state)) {
	        				if (workItems.length > 0) {
	        					workItems.each(
					        		function (index) {
				        				jQuery(this).empty();
					        			config.macros.kanban.render_workitem(tiddler, this);
					        		});	
	        				} else {
	        					config.macros.kanban.create_workitem(tiddler, this, state);
	        				}
        				} else {
        					//Work item is not in this kanban state
        					workItems.remove();
        				}
        			});
	        	} 
	        	else
	        	{
	        		//Tiddler was deleted, remove all on display.
	  				jQuery(".kanbanworkitem[kanbanid=\"" + tiddlerTitle + "\"]").remove();
	        	}
        	} 
        	catch(ex) {
        		pluginInfo.log.push("Exception thrown when updating tiddler: " + tiddlerTitle + "\nException was:  " + ex.name + "\n" + ex.message);
        	}
        }
    };
}
//}}} 

