/**
 * Created by zzq on 2016/4/26.
 */


// ȷ��jQuery��ol3toolkit.jsǰ����
if(typeof jQuery === "undefined"){
    throw new Error("ʹ��ol3toolkit��Ҫ�ȼ���jQuery");
}

// ȷ��OL3��ol3toolkit.jsǰ����
// Openlayers��дʱ�İ汾ΪV3.15.1
if(typeof ol === "undefined"){
    throw new Error("ʹ��ol3toolkit��Ҫ�ȼ���openlayers3");
}

// ȷ����������LayerSwitcher��ol3toolkit.jsǰ����
if(typeof ol.control.LayerSwitcher === "undefined"){
    throw new Error("Ϊ���л���ͼ�����ȼ���LayerSwitcher");
}

/* OL3Toolkit
 *
 * @type Object
 * @description $.OL3Toolkit��OL3���߰�������,�������ִ�г��ù���
 *
 */
$.OL3Toolkit = {};

/**
 *
 * @type {{}}
 */
$.OL3Toolkit.options = {
    //���ٳ�ʼ��
    quickCreation: true,
    //�󶨵�<div>Id
    targetID: "map",
    //��ͼ��ʼ��������
    viewCenter: [120.63,30.05],
    //��ʼ��ͼ���ŵȼ�
    zoomLevel: 7,
    //��ͼ����Դ
    baseMapSource: ["OSM",'SATELLITE'],
    //�Զ��������'EPSG:4326'ת����'EPSG:3857/900913'
    autoLatLngTransform: true,
    //��ͼ��С����Ӧ
    mapSizeSelfAdaption: true,
    //���ͼԴ�л�
    switchMultiMapSources: true,
    //������Ƭ���ؽ�����
    hasProgress: true,
    //��ʾ����������
    drawBasicElements: true,
    //�����
    birdsEye: true,
    //�ص���ʼ�ӽǹ���
    initialAngle: true,
    //��������
    basicMeasure: true,
    //��ͼ�ϵ�����
    basicPopup: true,
    //Ԥ����������ʽ
    sld: {
        lightBlue: "#3c8dbc",
        red: "#f56954",
        green: "#00a65a",
        aqua: "#00c0ef",
        yellow: "#f39c12",
        blue: "#0073b7",
        navy: "#001F3F",
        teal: "#39CCCC",
        olive: "#3D9970",
        lime: "#01FF70",
        orange: "#FF851B",
        fuchsia: "#F012BE",
        purple: "#8E24AA",
        maroon: "#D81B60",
        black: "#222222",
        gray: "#d2d6de"
    }
}

$(function() {
    
    //����������������壬����չ����
    if (typeof OL3ToolkitOptions !== "undefined") {
        $.extend(true,
            $.OL3Toolkit.options,
            OL3ToolkitOptions);
    }

    //������ò���
    var o = $.OL3Toolkit.options;
    
    //���Ҫ�����������Ļ�����map�·����һ��#progress��div
    if(o.hasProgress){
        $("#"+o.targetID).append('<div id="progress"></div>');
    }

    //��ʼ������
    _ol3ToolkitInit();
    
    if(o.quickCreation){
        $.OL3Toolkit.createMap.activate();
    }

    //���ڲ��õ�ģ����almasaeed2010/AdminLTE
    //https://github.com/almasaeed2010/AdminLTE
    //������Ҫ����Ӧ��������д'.content-wrapper'
    if(o.mapSizeSelfAdaption){
        $.OL3Toolkit.sizeSelfAdaption.activate('.content-wrapper');
    }



    map.addControl(new ol.control.LayerSwitcher());
})

/**
 * ----------------------
 * - ��ʼ��OL3Toolkit���� -
 * ----------------------
 * ����OL3Toolkit��������ִ��
 * @private
 */
function _ol3ToolkitInit() {


    $.OL3Toolkit.mapSources = {
        SATELLITE: function () {
            return new ol.layer.Tile({
                title: '��������',
                type: 'base',
                visible: false,
                source: new ol.source.MapQuest({
                    layer: 'sat'
                })
            });
        },
        OSM: function () {
            return new ol.layer.Tile({
                title: 'OSM',
                type: 'base',
                visible: true,
                source: new ol.source.OSM()
            });
        }
    };

    /**
     * �����򵥵�ͼ
     * ==========
     * ֻ�������ID
     * 
     * @type {{activate: $.OL3Toolkit.createMap.activate}}
     */
    $.OL3Toolkit.createMap = {
        activate: function(){
            var _this = this;
            //������ò���
            var o = $.OL3Toolkit.options;
            //��������Զ�ת����γ�ȣ��Ҳ�����ȷ����Ѿ�γ��ת���ɱ�׼����ο�ϵ
            if($.OL3Toolkit.options.autoLatLngTransform && o.viewCenter[0] <= 180 && o.viewCenter[0] >= -180 && o.viewCenter[1] <= 90 && o.viewCenter[1] >= -90){
                o.viewCenter = ol.proj.transform(o.viewCenter, 'EPSG:4326', 'EPSG:3857')
            }
            map = new ol.Map({
                layers: _this.createLayers(o.baseMapSource),
                target: o.targetID,
                view: new ol.View({
                    center:o.viewCenter,
                    zoom: o.zoomLevel
                })
            });
        },
        // ��װ�����յ�ͼ��
        createLayers: function(baseSource){
            var _this = this;
            
            var baseMaps = new ol.layer.Group({
                'title': '��ͼ����',
                layers: _this.traverseMapSources(baseSource)
            });
            var overlays = new ol.layer.Group({
                title: '����ͼ��',
                layers: [
                    new ol.layer.Tile({
                        title: '����',
                        source: new ol.source.TileWMS({
                            url: 'http://demo.opengeo.org/geoserver/wms',
                            params: {'LAYERS': 'ne:ne_10m_admin_1_states_provinces_lines_shp'},
                            serverType: 'geoserver'
                        })
                    })
                ]
            });
            return [baseMaps,overlays];
        },
        // ������������װ�ɵ�ͼͼ��
        traverseMapSources: function (neededMapSources) {
            var finalBaselayers = [];
            //���$.OL3Toolkit.mapSources������Ҫ�ĵ�ͼ������װ�ɵ�ͼͼ����
            for(var item in $.OL3Toolkit.mapSources){
                if(neededMapSources.includes(item)){
                    var source = $.OL3Toolkit.mapSources[item]();
                    if($.OL3Toolkit.options.hasProgress){
                        $.OL3Toolkit.progress.activate(source);
                    }                    
                    finalBaselayers.push(source);
                }
            }
            return finalBaselayers;
        }
    };


    $.OL3Toolkit.sizeSelfAdaption = {
        activate: function (outerClass) {
            var outerElem;
            //��û�д����ⲿ�����������������ⲿ�಻����ʱ���Զ�Ѱ���ⲿ��
            if(outerClass==undefined||$(outerClass).length==0){
                outerElem = $('#map').parent();
            }else{
                outerElem = $(outerClass);
            }
            //��ʼʱ����
            var _this = this;
            _this.fix(outerElem);
            //�ı䴰�ڴ�Сʱ�ٴε���
            outerElem.resize(function () {
                _this.fix(outerElem);
            });
        },
        fix: function (outerElem) {
            map.setSize([outerElem.width(),$(window).height() - $('.main-footer').outerHeight() - $('.main-header').outerHeight() - 5])
        }
    };

    //��Ƭ���ؽ���������
    $.OL3Toolkit.progress = {
        //����Ҫ���ɽ�������ol.source
        activate: function(linkedSource) {
            var this_ = this;
            this_.el = document.getElementById('progress');
            this_.loading = 0;
            this_.loaded = 0;
            linkedSource.getSource().on('tileloadstart', function() {
                this_.addLoading();
            });

            linkedSource.getSource().on('tileloadend', function() {
                this_.addLoaded();
            });
            linkedSource.getSource().on('tileloaderror', function() {
                this_.addLoaded();
            });
        },
        //ͳ��Ҫ��ʼ���ص�����
        addLoading: function() {
            if (this.loading === 0) {
              this.show();
            }
            ++this.loading;
            this.update();
        },
        // ͳ�������������
        addLoaded: function() {
            var this_ = this;
            setTimeout(function() {
              ++this_.loaded;
              this_.update();
            }, 100);
        },
        //���½������ĳ���
        update: function() {
            var width = (this.loaded / this.loading * 100).toFixed(1) + '%';
            this.el.style.width = width;
            if (this.loading === this.loaded) {
              this.loading = 0;
              this.loaded = 0;
              var this_ = this;
              setTimeout(function() {
                this_.hide();
              }, 500);
            }
        },
        //��ʾ������
        show: function() {
            this.el.style.visibility = 'visible';
        },
        // ���ؽ�����
        hide: function() {
            if (this.loading === this.loaded) {
              this.el.style.visibility = 'hidden';
              this.el.style.width = 0;
            }
        }
    }

}





/**
 * ���»��ڴ���Դ��cowboy/jquery-resize
 * https://github.com/cowboy/jquery-resize
 * ��ʱԭ�ⲻ�������ţ���������ɶ�Ķ�
 */
(function($,window,undefined){
    '$:nomunge'; // YUI compressorʹ�ò���.

    // һ��jQuery�����������Ҫ��resize�����ķ�windowԪ��
    var elems = $([]),

    // ���$.resize ������̳�, ���򴴽�һ��.
        jq_resize = $.resize = $.extend( $.resize, {} ),

        timeout_id,

    // �ظ����õ��ֶ�.
        str_setTimeout = 'setTimeout',
        str_resize = 'resize',
        str_data = str_resize + '-special-event',
        str_delay = 'delay',
        str_throttle = 'throttleWindow';

    // Property: jQuery.resize.delay
    // 
    // The numeric interval (in milliseconds) at which the resize event polling
    // loop executes. Defaults to 250.

    jq_resize[ str_delay ] = 100;

    // Property: jQuery.resize.throttleWindow
    // 
    // Throttle the native window object resize event to fire no more than once
    // every <jQuery.resize.delay> milliseconds. Defaults to true.
    // 
    // Because the window object has its own resize event, it doesn't need to be
    // provided by this plugin, and its execution can be left entirely up to the
    // browser. However, since certain browsers fire the resize event continuously
    // while others do not, enabling this will throttle the window resize event,
    // making event behavior consistent across all elements in all browsers.
    // 
    // While setting this property to false will disable window object resize
    // event throttling, please note that this property must be changed before any
    // window object resize event callbacks are bound.

    jq_resize[ str_throttle ] = true;

    // Event: resize event
    // 
    // Fired when an element's width or height changes. Because browsers only
    // provide this event for the window element, for other elements a polling
    // loop is initialized, running every <jQuery.resize.delay> milliseconds
    // to see if elements' dimensions have changed. You may bind with either
    // .resize( fn ) or .bind( "resize", fn ), and unbind with .unbind( "resize" ).
    // 
    // Usage:
    // 
    // > jQuery('selector').bind( 'resize', function(e) {
    // >   // element's width or height has changed!
    // >   ...
    // > });
    // 
    // Additional Notes:
    // 
    // * The polling loop is not created until at least one callback is actually
    //   bound to the 'resize' event, and this single polling loop is shared
    //   across all elements.
    // 
    // Double firing issue in jQuery 1.3.2:
    // 
    // While this plugin works in jQuery 1.3.2, if an element's event callbacks
    // are manually triggered via .trigger( 'resize' ) or .resize() those
    // callbacks may double-fire, due to limitations in the jQuery 1.3.2 special
    // events system. This is not an issue when using jQuery 1.4+.
    // 
    // > // While this works in jQuery 1.4+
    // > $(elem).css({ width: new_w, height: new_h }).resize();
    // > 
    // > // In jQuery 1.3.2, you need to do this:
    // > var elem = $(elem);
    // > elem.css({ width: new_w, height: new_h });
    // > elem.data( 'resize-special-event', { width: elem.width(), height: elem.height() } );
    // > elem.resize();

    $.event.special[ str_resize ] = {

        // Called only when the first 'resize' event callback is bound per element.
        setup: function() {
            // Since window has its own native 'resize' event, return false so that
            // jQuery will bind the event using DOM methods. Since only 'window'
            // objects have a .setTimeout method, this should be a sufficient test.
            // Unless, of course, we're throttling the 'resize' event for window.
            if ( !jq_resize[ str_throttle ] && this[ str_setTimeout ] ) { return false; }

            var elem = $(this);

            // Add this element to the list of internal elements to monitor.
            elems = elems.add( elem );

            // Initialize data store on the element.
            $.data( this, str_data, { w: elem.width(), h: elem.height() } );

            // If this is the first element added, start the polling loop.
            if ( elems.length === 1 ) {
                loopy();
            }
        },

        // Called only when the last 'resize' event callback is unbound per element.
        teardown: function() {
            // Since window has its own native 'resize' event, return false so that
            // jQuery will unbind the event using DOM methods. Since only 'window'
            // objects have a .setTimeout method, this should be a sufficient test.
            // Unless, of course, we're throttling the 'resize' event for window.
            if ( !jq_resize[ str_throttle ] && this[ str_setTimeout ] ) { return false; }

            var elem = $(this);

            // Remove this element from the list of internal elements to monitor.
            elems = elems.not( elem );

            // Remove any data stored on the element.
            elem.removeData( str_data );

            // If this is the last element removed, stop the polling loop.
            if ( !elems.length ) {
                clearTimeout( timeout_id );
            }
        },

        // Called every time a 'resize' event callback is bound per element (new in
        // jQuery 1.4).
        add: function( handleObj ) {
            // Since window has its own native 'resize' event, return false so that
            // jQuery doesn't modify the event object. Unless, of course, we're
            // throttling the 'resize' event for window.
            if ( !jq_resize[ str_throttle ] && this[ str_setTimeout ] ) { return false; }

            var old_handler;

            // The new_handler function is executed every time the event is triggered.
            // This is used to update the internal element data store with the width
            // and height when the event is triggered manually, to avoid double-firing
            // of the event callback. See the "Double firing issue in jQuery 1.3.2"
            // comments above for more information.

            function new_handler( e, w, h ) {
                var elem = $(this),
                    data = $.data( this, str_data );

                // If called from the polling loop, w and h will be passed in as
                // arguments. If called manually, via .trigger( 'resize' ) or .resize(),
                // those values will need to be computed.
                data.w = w !== undefined ? w : elem.width();
                data.h = h !== undefined ? h : elem.height();

                old_handler.apply( this, arguments );
            };

            // This may seem a little complicated, but it normalizes the special event
            // .add method between jQuery 1.4/1.4.1 and 1.4.2+
            if ( $.isFunction( handleObj ) ) {
                // 1.4, 1.4.1
                old_handler = handleObj;
                return new_handler;
            } else {
                // 1.4.2+
                old_handler = handleObj.handler;
                handleObj.handler = new_handler;
            }
        }

    };

    function loopy() {

        // Start the polling loop, asynchronously.
        timeout_id = window[ str_setTimeout ](function(){

            // Iterate over all elements to which the 'resize' event is bound.
            elems.each(function(){
                var elem = $(this),
                    width = elem.width(),
                    height = elem.height(),
                    data = $.data( this, str_data );

                // If element size has changed since the last time, update the element
                // data store and trigger the 'resize' event.
                if ( width !== data.w || height !== data.h ) {
                    elem.trigger( str_resize, [ data.w = width, data.h = height ] );
                }

            });

            // Loop.
            loopy();

        }, jq_resize[ str_delay ] );

    };

})(jQuery,this);
