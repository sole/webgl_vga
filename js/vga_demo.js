window.onload = function() {
	init();
}

function init() {
	var canvas_w, canvas_h, camera, scene, renderer,
	figure, circles, color_cubes = [], moire_blocks = [],
	blue = 0, blue_change = 0.01, auto_update = true;
	
	if ( ! Detector.webgl ) {
		Detector.addGetWebGLMessage();
		return;
	}
	
	canvas_w = window.innerWidth;
	canvas_h = window.innerHeight;

	scene = new THREE.Scene();

	camera = new THREE.OrthographicCamera(-canvas_w / 2, canvas_w / 2, canvas_h / 2, -canvas_h / 2, 1, 10000);
	camera.position.z = 1000;
	scene.add(camera);

	//setupAxis(scene);
	figure = setupFigure();
	circles = setupCircles();
	color_cubes = setupColorCubes();
	moire_blocks = setupMoireBlocks();
	setupText();
	setupKeyboard();

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(canvas_w, canvas_h);
	renderer.setClearColor(0x000000, 1);

	document.body.appendChild(renderer.domElement);

	animate();

	// ----

	function setupAxis() {
		var axis = [ 
			{ points: [ [0, 0, 0], [1000, 0, 0] ], color: 0xFF0000}, // +X
			{ points: [ [0, 0, 0], [-1000, 0, 0] ], color: 0x400000}, // -X
			{ points: [ [0, 0, 0], [0, 1000, 0] ], color: 0x00FF00}, // +Y
			{ points: [ [0, 0, 0], [0, -1000, 0] ], color: 0x004000}, // -Y
		]
		
		for(var m = 0; m < axis.length; m++) {
			var ax = axis[m],
				geom = new THREE.Geometry();
			for(var j = 0; j < ax.points.length; j++) {
				var p = ax.points[j];
				geom.vertices.push(new THREE.Vector3(p[0], p[1], p[2]));
			}
			var mat = new THREE.LineBasicMaterial({color: ax.color, linewidth: 2 });
			var ax_line = new THREE.Line(geom, mat);
			ax_line.position.x = 0;
			ax_line.position.y = 0;
			ax_line.position.z = 0;
			scene.add(ax_line);
		}
	}

	function setupFigure() {
		var geometry = new THREE.Geometry(),
			material,
			mult = Math.min(canvas_w, canvas_h) / 2,
			figure,
			w = 0.90 * canvas_w / 4,
			h = 0.90 * canvas_h / 2,
			colors = [ 0xFF55FF, 0x55FF55, 0x5FF5FF, 0xFF5555 ],
			num_heights = colors.length,
			heights = [],
			sep = h / num_heights,
			left = -w/2, right = w/2;

		for(var i = 0; i < num_heights; i++) {
			heights.push(sep * i);
		}

		for(var i = 0; i < num_heights; i++) {
			var color = colors[i % colors.length],
				height = heights[i],
				vertices = [
					[left, 0, 0], // leftmost, top
					[right, -height, 0], // to the right, below
					[left, -h, 0], // leftmost, bottom
					[right, -h, 0], // rightmost, bottom
					[left, -height, 0], // left, below
					[right, 0, 0], // rightmost, top,
					[left, 0, 0]
				];

			for(var j = 0; j < vertices.length; j++) {
				var v = vertices[j];
				var vertex = new THREE.Vector3(v[0], v[1], v[2]);
				geometry.vertices.push(vertex);
				geometry.colors.push(new THREE.Color(color));
			}
		}

		material = new THREE.LineBasicMaterial({
			linewidth: 2,
			vertexColors: true
		});

		figure = new THREE.Line(geometry, material, THREE.LineStrip);
		figure.position.x = -(canvas_w - w) / 2;
		figure.position.y = h + (canvas_h/2 - h) / 2;
		figure.position.z = 0;
		scene.add(figure);

		return figure;
	}

	function setupCircles() {
		var colors = [ 0xFFFF55, 0xFF55FF, 0xFF5555, 0x55FFFF, 0x55FF55 ],
			circles = new THREE.Object3D(),
			num_segments = 64,
			h = 0.90 * Math.min(canvas_h / 2, canvas_w / 4),
			radius = h / 2,
			radius_inc = radius / colors.length;


		for(var i = 0; i < colors.length; i++) {
			var geometry = new THREE.Geometry(),
				material = new THREE.LineBasicMaterial({ color: colors[i], linewidth: 2 });
						
			for(var j = 0; j < num_segments+1; j++) {
				var angle = Math.PI * 2 * (j / num_segments);
				var v = new THREE.Vector3();
				v.x = radius * Math.sin(angle);
				v.y = radius * Math.cos(angle);
				v.z = 0;

				geometry.vertices.push(v);
			}
			
			var circle = new THREE.Line(geometry, material, THREE.LineStrip);
			circle.radius = radius; // 'custom' property

			circles.add(circle);
			radius -= radius_inc;
		}
		circles.position.x = -(canvas_w / 4 - h/2);
		circles.position.y = canvas_h / 4;
		scene.add(circles);
		return circles;
	}

	function setupMoireBlocks() {
		var moire_blocks = [],
			moire_span = canvas_w,
			moire_startx = -moire_span / 2,
			n_stripes = 7,
			inc_stripes = 9,
			num_blocks = 10,
			block_w = moire_span / num_blocks,
			block_h = canvas_h / 7,
			stripe_mat = new THREE.MeshBasicMaterial({color: 0xFFFF00, wireframe: false});

			moire_startx += block_w / 2;

		for(var i = 0; i < num_blocks; i++) {
			var vertical = (i % 2 == 0),
				stripe_size,
				block,
				geom_w, geom_h;


			if(vertical) {
				stripe_size = 0.5 * block_h / (n_stripes);
			} else {
				stripe_size = 0.5 * block_w / (n_stripes);
			}

			geom_hor = new THREE.CubeGeometry(block_w, stripe_size, block_w);
			geom_ver = new THREE.CubeGeometry(stripe_size, block_h, block_w);

			block = new THREE.Object3D();

			for(var j = 0; j < n_stripes; j++) {
				var stripe;

				if(vertical) {
					// vertically stacked
					stripe = new THREE.Mesh(geom_hor, stripe_mat);
					stripe.position.x = -stripe_size / 2;
					stripe.position.y = 0 - stripe_size * j * 2 - stripe_size/2;
				} else {
					// horizontal blocks, left to right
					stripe = new THREE.Mesh(geom_ver, stripe_mat);
					stripe.position.x = -block_w / 2 + stripe_size * j * 2;
					stripe.position.y = -block_h / 2;
				}

				block.add(stripe);
			}

			scene.add(block);
			moire_blocks.push(block);
			block.position.x = moire_startx;
			block.position.y = 0;
			block.position.z = 100;
			moire_startx += block_w;
			if(i % 2 != 0) {
				n_stripes += inc_stripes;
			}
		}
		return moire_blocks;
	}

	function setupColorCubes() {
		// Color cubes
		var ega_colors = [0x000000, 0x0000AA, 0x00AA00, 0x00AAAA, 0xAA0000, 0xAA00AA, 0xAA5500, 0xAAAAAA, 0x555555, 0x5555FF, 0x55FF55, 0x55FFFF, 0xFF5555, 0xFF55FF, 0xFFFF55, 0xFFFFFF], num_cubes_x = ega_colors.length;
		var color_cubes = [], i, w = canvas_w * .5, h = canvas_h * 0.45, num_x = num_cubes_x, num_y = num_x, sx = w / num_x, sy = h / num_y, ox = sx/2, oy = h+sy;

		var makeCube = function(sx, sy, color) {
			var cube_g = new THREE.CubeGeometry(sx, sy, Math.min(sx, sy));
			var c = new THREE.Color(color);
			var cube_mat = new THREE.MeshBasicMaterial({ color: c.getHex() });
			var cube_mesh = new THREE.Mesh(cube_g, cube_mat);
			scene.add(cube_mesh);
			color_cubes.push(cube_mesh);
			return cube_mesh;
		}

		for(i = 0; i < num_x; i++) {
			var cube_mesh = makeCube(sx, sy, ega_colors[i]);
			cube_mesh.position.x = ox + i * sx;
			cube_mesh.position.y = oy;
		}

		oy -= sy;

		for(j = 0; j < num_y; j++) {
			var y = oy - j * sy;
			for(var i = 0; i < num_x; i++) {
				var x = ox + i * sx;
				var c = new THREE.Color();
				c.setRGB(i * 1.0 / num_x, j * 1.0 / num_y, 0);
				var cube_mesh = makeCube(sx, sy, c.getHex());
				cube_mesh.position.x = x;
				cube_mesh.position.y = y;
			}
		}
		return color_cubes;
	}
	
	function setupText() {
		var text = document.getElementById('text'),
			row_len = 32,
			num_chars = 255,
			num_rows = num_chars / row_len,
			rows = [],
			str = '';

		for(var i = 0; i < num_rows; i++) {
			str = '<p>';
			var base = i * row_len, to = base + row_len;
			for(var j = base; j < to && j < num_chars; j++) {
				str += String.fromCharCode(j);
			}

			str += '</p>';
			rows.push(str);
		}
		
		var div = document.createElement('div');
		div.id = 'test';
		div.innerHTML = rows.join('');

		var existingDiv = document.querySelector('#text>div');
		text.insertBefore(div, existingDiv);
	}

	function setupKeyboard() {
		window.addEventListener('keydown', function(event) {
			var keyCode = event.keyCode;

			if(keyCode == 32) {
				auto_update = !auto_update;
			} else {
				return true;
			}

			event.stopPropagation();
			event.preventDefault();
			

			
			return false;
		}, false);

		window.addEventListener('keypress', function(event) {
			var code = event.keyCode;

			if(code == 37) {
				// left
				blue -= 0.01;
			} else if(code == 39) {
				// right
				blue += 0.01;
			} else if(code == 38) {
				// up
				blue = 0;
			} else if(code == 40) {
				// down
				blue = 1;
			} else {
				return true;
			}

			event.stopPropagation();
			event.preventDefault();

			
			return false;
		}, false);
	}

	function animate() {
		requestAnimationFrame(animate);
		render();
	}

	function render() {
		var t = Date.now(),
			delta = Math.PI * 2 / color_cubes.length;

		if(auto_update) {
			blue += blue_change;

			if(blue > 1.0) {
				blue = 1;
				blue_change = -blue_change;
			} else if(blue < 0) {
				blue = 0;
				blue_change = -blue_change;
			}

			for(var i = 0; i < color_cubes.length; i++) {
				var color_cube = color_cubes[i];
		
				var tt = 0.0001 * (t+i);
				color_cube.rotation.z += 0.01;
				var sc = 0.80 + 0.20 * Math.sin(0.00125 * t + 0.5*i * delta);
				color_cube.scale.x = sc;
				color_cube.scale.y = sc;
				color_cube.scale.z = sc;
			}
			
			figure.rotation.y += 0.01;

			var tc = (t * 0.01 + 0.5 * Math.sin(t * 0.001)) * 0.5;
			for(var i = 0; i < circles.children.length; i++) {
				var circle = circles.children[i];
				var r = circle.radius;
				var ra = r * 0.1;

				circle.position.x = ra * Math.sin(tc + r);
				circle.position.y = ra * Math.cos(tc + r);
			}
		}

		for(var i = 0; i < color_cubes.length; i++) {
			var color_cube = color_cubes[i];
			var mat = color_cube.material.color;
			if(i >= 16)
				mat.b = blue;
		}

		renderer.render(scene, camera);

	}
}
