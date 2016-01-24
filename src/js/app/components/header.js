var B       = require( '../../libs/burno-0.3.js' ),
    glslify = require( 'glslify' ),
    $       = require( 'jquery' ),
    THREE   = require( 'three-js' )()

module.exports = B.Core.Abstract.extend( {

    options : {},

    construct : function( options )
    {
        this._super( options )

        var that = this

        // Set up
        this.ticker      = new B.Tools.Ticker()
        this.viewport    = new B.Tools.Viewport()
        this.$.container = $( 'header.header' )
        this.$.canvas    = this.$.container.find( 'canvas' )

        // Init
        this.init_scroll()
        this.init_sun()

    },

    /**
     * INIT SCROLL
     */
    init_scroll : function()
    {
        var that = this;

        this.$.scroll_trigger = this.$.container.find( 'a.scroll' )
        console.log(this.$.scroll_trigger);

        // Viewport scroll event
        this.viewport.on( 'scroll', function()
        {
            // Update canvas position
            that.$.canvas.css( { transform : 'translateY(' + that.viewport.top * 0.40 + 'px) translateZ(0)' } )
        } )

        // Scroll trigger click event
        this.$.scroll_trigger.on( 'click', function()
        {
            console.log('ok');

            return
        } )
    },

    /**
     * INIT SUN
     */
    init_sun : function()
    {
        var that = this;

        /**
         * Set up
         */
        var canvas     = document.querySelector( 'header.header canvas' ),
            scene      = new THREE.Scene(),
            camera     = new THREE.PerspectiveCamera( 55, this.viewport.width / this.viewport.height, 0.1, 100000 ),
            renderer   = new THREE.WebGLRenderer( { canvas : canvas, alpha : true } ),
            mouse      = { down : false, origin : { x : 0, y : 0 }, offset : { x : 0, y : 0 }, wheel : 300 },
            start_time = + new Date();

        camera.position.z = 10;
        renderer.setClearColor( 0x1a0107, 1 );

        /**
         * Resize function
         */
        var resize = function()
        {
            // Resize renderer
            renderer.setSize( that.viewport.width, that.viewport.height );

            // Update camera
            camera.aspect = that.viewport.width / that.viewport.height;
            camera.updateProjectionMatrix();
        };

        window.onresize = resize;
        resize();

        /**
         * Mouse function
         */
        var mouse_move = function( e )
        {
            if(mouse.down)
            {
                var ratio_x = ( e.clientX / that.viewport.width - 0.5 ) * 2,
                    ratio_y = - ( e.clientY / that.viewport.height - 0.5 ) * 2;

                mouse.offset.x += ratio_x - mouse.origin.x;
                mouse.offset.y += ratio_y - mouse.origin.y;

                if( mouse.offset.y < - 0.5 )
                    mouse.offset.y = - 0.5;
                else if( mouse.offset.y > 0.5 )
                    mouse.offset.y = 0.5;

                mouse.origin.x = ratio_x;
                mouse.origin.y = ratio_y;
            }
        };

        var mouse_down = function( e )
        {
            mouse.down = true;

            var ratio_x = ( e.clientX / that.viewport.width - 0.5 ) * 2,
                ratio_y = - ( e.clientY / that.viewport.height - 0.5 ) * 2;

            mouse.origin.x = ratio_x;
            mouse.origin.y = ratio_y;
        };

        var mouse_up = function( e )
        {
            mouse.down = false;
        };

        var mouse_wheel = function( e )
        {
            // e.preventDefault();

            // if(e.detail)
            //     mouse.wheel += e.detail * 3;
            // else
            //     mouse.wheel += e.deltaY;

            // if( mouse.wheel < 100 )
            //     mouse.wheel = 100;
            // else if( mouse.wheel > 5000 )
            //     mouse.wheel = 5000;
        };

        document.onmousemove  = mouse_move;
        document.onmousedown  = mouse_down;
        document.onmouseup    = mouse_up;

        if ('onmousewheel' in document )
            document.onmousewheel = mouse_wheel;
        else
            document.addEventListener( 'DOMMouseScroll', mouse_wheel, false );

        /**
         * Star
         */
        var star_object = new THREE.Object3D();
        scene.add(star_object);

        // Colors
        var colors =
        {
            current : [],
            red :
            [
                '#440000',
                '#ff6600',
                '#ffd236',
                '#ffe68f',
            ],
            blue :
            [
                '#001159',
                '#0072ff',
                '#00c7ff',
                '#90f6ff',
            ],
            green :
            [
                '#00361f',
                '#47ca00',
                '#78ff00',
                '#c7ff67',
            ]
        };
        colors.current = Object.create(colors.red);

        // Uniforms (for sphere and halo)
        var star_uniforms = {
            sphere_radius :
            {
                type  : 'f',
                value : 1
            },
            sphere_position :
            {
                type  : 'v3',
                value : new THREE.Vector3(0,0,0)
            },
            time :
            {
                type  : 'f',
                value : 0
            },
            time_multiplier :
            {
                type  : 'f',
                value : 0.0005
            },
            color_step_1 :
            {
                type  : 'c',
                value : new THREE.Color(colors.current[0])
            },
            color_step_2 :
            {
                type  : 'c',
                value : new THREE.Color(colors.current[1])
            },
            color_step_3 :
            {
                type  : 'c',
                value : new THREE.Color(colors.current[2])
            },
            color_step_4 :
            {
                type  : 'c',
                value : new THREE.Color(colors.current[3])
            },
            ratio_step_1 :
            {
                type  : 'f',
                value : 0.4
            },
            ratio_step_2 :
            {
                type  : 'f',
                value : 0.9
            },
            displacement :
            {
                type  : 'f',
                value : 0.03
            }
        };

        /**
         * Sphere
         */
        var sphere_vertex_shader   = glslify( '../../../shaders/star_sphere.vertex.glsl' ),
            sphere_fragment_shader = glslify( '../../../shaders/star_sphere.fragment.glsl' ),
            sphere_geometry = new THREE.SphereGeometry( 1, 100, 100 ),
            sphere_material = new THREE.ShaderMaterial( {
                wireframe      : false,
                vertexShader   : sphere_vertex_shader,
                fragmentShader : sphere_fragment_shader,
                uniforms       : star_uniforms,
                transparent    : true
            } ),
            sphere_object = new THREE.Mesh( sphere_geometry, sphere_material );

        star_object.add( sphere_object );

        /**
         * Halo
         */
        var halo_vertex_shader   = glslify( '../../../shaders/star_halo.vertex.glsl' ),
            halo_fragment_shader = glslify( '../../../shaders/star_halo.fragment.glsl' ),
            halo_uniforms        = star_uniforms,
            halo_geometry = new THREE.PlaneBufferGeometry( 4, 4, 40, 40 ),
            halo_material = new THREE.ShaderMaterial( {
                vertexShader   : halo_vertex_shader,
                fragmentShader : halo_fragment_shader,
                uniforms       : star_uniforms,
                transparent    : true
            } ),
            // halo_material = new THREE.MeshBasicMaterial( { color : 0xff0000 } ),
            halo_object = new THREE.Mesh( halo_geometry, halo_material );

        scene.add( halo_object );

        /**
         * Frame function
         */
        this.ticker.on( 'tick', function()
        {
            // Not in screen
            if( that.viewport.top > that.viewport.height )
                return

            // Update camera
            var phi   = - mouse.offset.y * Math.PI,
                theta = - mouse.offset.x * Math.PI;

            var x = - ( mouse.wheel / 100 + 1 ) * Math.cos( phi ) * Math.cos( theta ),
                y = ( mouse.wheel / 100 + 1 ) * Math.sin( phi ),
                z = ( mouse.wheel / 100 + 1 ) * Math.cos( phi ) * Math.sin( theta );

            camera.position.x += (x - camera.position.x) / 4;
            camera.position.y += (y - camera.position.y) / 4;
            camera.position.z += (z - camera.position.z) / 4;

            camera.lookAt( new THREE.Vector3() );

            // Update sphere
            star_uniforms.time.value = + new Date() - start_time;

            // Update halo
            halo_object.lookAt( camera.position );

            // Render
            renderer.render( scene, camera );
        } )
    }
} )
