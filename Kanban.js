/***
|''Name''|TiddlyKanban|
|''Description''|Renders tiddlers into a KANBAN and allows editing by drag-and-drop.|
|''Maintainer''|Tim Barnes|
|''Version''|0.9.0|
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
!TODO
* Work card colours
* Work card tracking
!Known Issues
* Autoupdate does not work for tiddlers with spaces in the titles.
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

	// jQuery List DragSort v0.4.3
	// License: http://dragsort.codeplex.com/license
	(function(b){b.fn.dragsort=function(k){var d=b.extend({},b.fn.dragsort.defaults,k),g=[],a=null,j=null;this.selector&&b("head").append("<style type='text/css'>"+(this.selector.split(",").join(" "+d.dragSelector+",")+" "+d.dragSelector)+" { cursor: pointer; }</style>");this.each(function(k,i){b(i).is("table")&&b(i).children().size()==1&&b(i).children().is("tbody")&&(i=b(i).children().get(0));var m={draggedItem:null,placeHolderItem:null,pos:null,offset:null,offsetLimit:null,scroll:null,container:i,init:function(){b(this.container).attr("data-listIdx", k).mousedown(this.grabItem).find(d.dragSelector).css("cursor","pointer");b(this.container).children(d.itemSelector).each(function(a){b(this).attr("data-itemIdx",a)})},grabItem:function(e){if(!(e.which!=1||b(e.target).is(d.dragSelectorExclude))){for(var c=e.target;!b(c).is("[data-listIdx='"+b(this).attr("data-listIdx")+"'] "+d.dragSelector);){if(c==this)return;c=c.parentNode}a!=null&&a.draggedItem!=null&&a.dropItem();b(e.target).css("cursor","move");a=g[b(this).attr("data-listIdx")];a.draggedItem= b(c).closest(d.itemSelector);var c=parseInt(a.draggedItem.css("marginTop")),f=parseInt(a.draggedItem.css("marginLeft"));a.offset=a.draggedItem.offset();a.offset.top=e.pageY-a.offset.top+(isNaN(c)?0:c)-1;a.offset.left=e.pageX-a.offset.left+(isNaN(f)?0:f)-1;if(!d.dragBetween)c=b(a.container).outerHeight()==0?Math.max(1,Math.round(0.5+b(a.container).children(d.itemSelector).size()*a.draggedItem.outerWidth()/b(a.container).outerWidth()))*a.draggedItem.outerHeight():b(a.container).outerHeight(),a.offsetLimit= b(a.container).offset(),a.offsetLimit.right=a.offsetLimit.left+b(a.container).outerWidth()-a.draggedItem.outerWidth(),a.offsetLimit.bottom=a.offsetLimit.top+c-a.draggedItem.outerHeight();var c=a.draggedItem.height(),f=a.draggedItem.width(),h=a.draggedItem.attr("style");a.draggedItem.attr("data-origStyle",h?h:"");d.itemSelector=="tr"?(a.draggedItem.children().each(function(){b(this).width(b(this).width())}),a.placeHolderItem=a.draggedItem.clone().attr("data-placeHolder",!0),a.draggedItem.after(a.placeHolderItem), a.placeHolderItem.children().each(function(){b(this).css({borderWidth:0,width:b(this).width()+1,height:b(this).height()+1}).html("&nbsp;")})):(a.draggedItem.after(d.placeHolderTemplate),a.placeHolderItem=a.draggedItem.next().css({height:c,width:f}).attr("data-placeHolder",!0));a.draggedItem.css({position:"absolute",opacity:0.8,"z-index":999,height:c,width:f});b(g).each(function(a,b){b.createDropTargets();b.buildPositionTable()});a.scroll={moveX:0,moveY:0,maxX:b(document).width()-b(window).width(), maxY:b(document).height()-b(window).height()};a.scroll.scrollY=window.setInterval(function(){if(d.scrollContainer!=window)b(d.scrollContainer).scrollTop(b(d.scrollContainer).scrollTop()+a.scroll.moveY);else{var c=b(d.scrollContainer).scrollTop();if(a.scroll.moveY>0&&c<a.scroll.maxY||a.scroll.moveY<0&&c>0)b(d.scrollContainer).scrollTop(c+a.scroll.moveY),a.draggedItem.css("top",a.draggedItem.offset().top+a.scroll.moveY+1)}},10);a.scroll.scrollX=window.setInterval(function(){if(d.scrollContainer!=window)b(d.scrollContainer).scrollLeft(b(d.scrollContainer).scrollLeft()+ a.scroll.moveX);else{var c=b(d.scrollContainer).scrollLeft();if(a.scroll.moveX>0&&c<a.scroll.maxX||a.scroll.moveX<0&&c>0)b(d.scrollContainer).scrollLeft(c+a.scroll.moveX),a.draggedItem.css("left",a.draggedItem.offset().left+a.scroll.moveX+1)}},10);a.setPos(e.pageX,e.pageY);b(document).bind("selectstart",a.stopBubble);b(document).bind("mousemove",a.swapItems);b(document).bind("mouseup",a.dropItem);d.scrollContainer!=window&&b(window).bind("DOMMouseScroll mousewheel",a.wheel);return!1}},setPos:function(e, c){var f=c-this.offset.top,h=e-this.offset.left;d.dragBetween||(f=Math.min(this.offsetLimit.bottom,Math.max(f,this.offsetLimit.top)),h=Math.min(this.offsetLimit.right,Math.max(h,this.offsetLimit.left)));this.draggedItem.parents().each(function(){if(b(this).css("position")!="static"&&(!b.browser.mozilla||b(this).css("display")!="table")){var a=b(this).offset();f-=a.top;h-=a.left;return!1}});if(d.scrollContainer==window)c-=b(window).scrollTop(),e-=b(window).scrollLeft(),c=Math.max(0,c-b(window).height()+ 5)+Math.min(0,c-5),e=Math.max(0,e-b(window).width()+5)+Math.min(0,e-5);else var l=b(d.scrollContainer),g=l.offset(),c=Math.max(0,c-l.height()-g.top)+Math.min(0,c-g.top),e=Math.max(0,e-l.width()-g.left)+Math.min(0,e-g.left);a.scroll.moveX=e==0?0:e*d.scrollSpeed/Math.abs(e);a.scroll.moveY=c==0?0:c*d.scrollSpeed/Math.abs(c);this.draggedItem.css({top:f,left:h})},wheel:function(e){if((b.browser.safari||b.browser.mozilla)&&a&&d.scrollContainer!=window){var c=b(d.scrollContainer),f=c.offset();e.pageX>f.left&& e.pageX<f.left+c.width()&&e.pageY>f.top&&e.pageY<f.top+c.height()&&(f=e.detail?e.detail*5:e.wheelDelta/-2,c.scrollTop(c.scrollTop()+f),e.preventDefault())}},buildPositionTable:function(){var a=this.draggedItem==null?null:this.draggedItem.get(0),c=[];b(this.container).children(d.itemSelector).each(function(d,h){if(h!=a){var g=b(h).offset();g.right=g.left+b(h).width();g.bottom=g.top+b(h).height();g.elm=h;c.push(g)}});this.pos=c},dropItem:function(){if(a.draggedItem!=null){b(a.container).find(d.dragSelector).css("cursor", "pointer");a.placeHolderItem.before(a.draggedItem);var e=a.draggedItem.attr("data-origStyle");a.draggedItem.attr("style",e);e==""&&a.draggedItem.removeAttr("style");a.draggedItem.removeAttr("data-origStyle");a.placeHolderItem.remove();b("[data-dropTarget]").remove();window.clearInterval(a.scroll.scrollY);window.clearInterval(a.scroll.scrollX);var c=!1;b(g).each(function(){b(this.container).children(d.itemSelector).each(function(a){parseInt(b(this).attr("data-itemIdx"))!=a&&(c=!0,b(this).attr("data-itemIdx", a))})});c&&d.dragEnd.apply(a.draggedItem);a.draggedItem=null;b(document).unbind("selectstart",a.stopBubble);b(document).unbind("mousemove",a.swapItems);b(document).unbind("mouseup",a.dropItem);d.scrollContainer!=window&&b(window).unbind("DOMMouseScroll mousewheel",a.wheel);return!1}},stopBubble:function(){return!1},swapItems:function(e){if(a.draggedItem==null)return!1;a.setPos(e.pageX,e.pageY);for(var c=a.findPos(e.pageX,e.pageY),f=a,h=0;c==-1&&d.dragBetween&&h<g.length;h++)c=g[h].findPos(e.pageX, e.pageY),f=g[h];if(c==-1||b(f.pos[c].elm).attr("data-placeHolder"))return!1;j==null||j.top>a.draggedItem.offset().top||j.left>a.draggedItem.offset().left?b(f.pos[c].elm).before(a.placeHolderItem):b(f.pos[c].elm).after(a.placeHolderItem);b(g).each(function(a,b){b.createDropTargets();b.buildPositionTable()});j=a.draggedItem.offset();return!1},findPos:function(a,b){for(var d=0;d<this.pos.length;d++)if(this.pos[d].left<a&&this.pos[d].right>a&&this.pos[d].top<b&&this.pos[d].bottom>b)return d;return-1}, createDropTargets:function(){d.dragBetween&&b(g).each(function(){var d=b(this.container).find("[data-placeHolder]"),c=b(this.container).find("[data-dropTarget]");d.size()>0&&c.size()>0?c.remove():d.size()==0&&c.size()==0&&(b(this.container).append(a.placeHolderItem.removeAttr("data-placeHolder").clone().attr("data-dropTarget",!0)),a.placeHolderItem.attr("data-placeHolder",!0))})}};m.init();g.push(m)});return this};b.fn.dragsort.defaults={itemSelector:"li",dragSelector:"li",dragSelectorExclude:"input, textarea, a[href]", dragEnd:function(){},dragBetween:!1,placeHolderTemplate:"<li>&nbsp;</li>",scrollContainer:window,scrollSpeed:5}})(jQuery);
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
    		store.addNotification(null, this.tiddler_changed);
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
        	//Guard against tiddler titles with spaces
        	//Not supported for now
        	if (tiddlerTitle.search(" ") != -1) {
        		return;
        	}
        	
        	try {
	         	var tiddler = store.getTiddler(tiddlerTitle);
	        	if (tiddler)
	        	{
	        		jQuery(".kanbancolumn").each(function (index) {
        				var state = jQuery(this).attr("kanbanstate");
        				
        				//Get all the matching workitems for this column
        				var workItems = jQuery(this).children(".kanbanworkitem[kanbanid=" + tiddlerTitle + "]");
        				
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
	  				jQuery(".kanbanworkitem[kanbanid=" + tiddlerTitle + "]").remove();
	        	}
        	} 
        	catch(ex) {
        		pluginInfo.log.push("Exception thrown when updating tiddler: " + tiddlerTitle + "\nException was:  " + ex.name + "\n" + ex.message);
        	}
        }
    };
}
//}}} 

