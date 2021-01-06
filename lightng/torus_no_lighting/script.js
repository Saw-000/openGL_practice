onload = function(){
    // キャンバスエレメント取得
    var c = document.getElementById("canvas");
    // キャンバスの幅と高さを設定
    c.width = 500;
    c.height = 300;

    // webglコンテキストを取得
    var gl = c.getContext("webgl") || c.getContext("experimental-webgl");

    // シェーダー生成
    var v_shader = create_shader("vs");
    var f_shader = create_shader("fs");

    // プログラム作成
    var prg = create_program(v_shader, f_shader);

    // attributeLocationの取得
    var attLocation = new Array(2);
    attLocation[0] = gl.getAttribLocation(prg, "position");
    attLocation[1] = gl.getAttribLocation(prg, "color");

    // attributeの要素数を設定
    var attStride = new Array(2);
    attStride[0] = 3;
    attStride[1] = 4;

    // トーラス頂点情報の生成
    var vData_torus = torus(32, 32, 1.0, 2.0);
    var tPosition = vData_torus[0];
    var tColor = vData_torus[1];
    var tIndex = vData_torus[2];

    // vbo生成
    var vbo = new Array(2);
    vbo[0] = create_vbo(tPosition);
    vbo[1] = create_vbo(tColor);
    // vbo登録
    set_attribute(vbo, attLocation, attStride);

    // ibo生成
    var ibo = create_ibo(tIndex);
    // ibo登録
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);


    // uniformLocationの取得
    var uniLocation = gl.getUniformLocation(prg, "mvpMatrix");
    // 行列モジュールのオブジェクト生成
    var m = new matIV();

    // 座標変換行列の初期化
    var mMat = m.identity(m.create());
    var vMat = m.identity(m.create());
    var pMat = m.identity(m.create());
    var tmpMat = m.identity(m.create());
    var mvpMat = m.identity(m.create());

    // ビュー x プロジェクション座標変換行列 作成
    m.lookAt([0.0, 0.0, 15.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMat);
    m.perspective(45, c.width / c.height, 0.1, 100, pMat);
    m.multiply(pMat, vMat, tmpMat);

    // 描画
    // カリングと深度テストを有効にする
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
    // 角度(°)カウンター
    var count = 0;
    // 時間経過に伴う描画処理
    (function(){
        // キャンバス初期化
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // カウンター増
        count++;

        // 角度(rad)生成
        var rad = (2 * Math.PI) * (count % 360);

        // モデル座標変換行列 生成
        m.identity(mMat);
        m.rotate(mMat, rad / 150, [0, 1.0, 1.0], mMat);
        // mvp座標変換行列 生成
        m.multiply(tmpMat, mMat, mvpMat);
        // mvp座標変換行列 登録
        gl.uniformMatrix4fv(uniLocation, false, mvpMat);

        // 描画
        gl.drawElements(gl.TRIANGLES, tIndex.length, gl.UNSIGNED_SHORT, 0);
        // コンテキストの再描画
        gl.flush();

        // ループのために再帰呼び出し
		setTimeout(arguments.callee, 1000 / 30);
    })();


    /* function */
    // シェーダを生成する関数
	function create_shader(id){
		// シェーダを格納する変数
		var shader;
		// HTMLからscriptタグへの参照を取得
		var scriptElement = document.getElementById(id);
		// scriptタグが存在しない場合は抜ける
		if(!scriptElement){return;}
		// scriptタグのtype属性をチェック
		switch(scriptElement.type){
			// 頂点シェーダの場合
			case 'x-shader/x-vertex':
				shader = gl.createShader(gl.VERTEX_SHADER);
				break;
			// フラグメントシェーダの場合
			case 'x-shader/x-fragment':
				shader = gl.createShader(gl.FRAGMENT_SHADER);
				break;
			default :
				return;
		}
		// 生成されたシェーダにソースを割り当てる
		gl.shaderSource(shader, scriptElement.text);
		// シェーダをコンパイルする
		gl.compileShader(shader);
		// シェーダが正しくコンパイルされたかチェック
		if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
			// 成功していたらシェーダを返して終了
			return shader;
		}else{
			// 失敗していたらエラーログをアラートする
			alert(gl.getShaderInfoLog(shader));
		}
    }

    // プログラムオブジェクトを生成しシェーダをリンクする関数
	function create_program(vs, fs){
		// プログラムオブジェクトの生成
		var program = gl.createProgram();
		// プログラムオブジェクトにシェーダを割り当てる
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		// シェーダをリンク
		gl.linkProgram(program);
		// シェーダのリンクが正しく行なわれたかチェック
		if(gl.getProgramParameter(program, gl.LINK_STATUS)){
			// 成功していたらプログラムオブジェクトを有効にする
			gl.useProgram(program);
			// プログラムオブジェクトを返して終了
			return program;
		}else{
			// 失敗していたらエラーログをアラートする
			alert(gl.getProgramInfoLog(program));
		}
	}

	// VBOを生成する関数
	function create_vbo(data){
		// バッファオブジェクトの生成
		var vbo = gl.createBuffer();
		// バッファをバインドする
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		// バッファにデータをセット
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		// バッファのバインドを無効化
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		// 生成した VBO を返して終了
		return vbo;
	}

	// VBOをバインドし登録する関数
	function set_attribute(vbo, attL, attS){
		// 引数として受け取った配列を処理する
		for(var i in vbo){
			// バッファをバインドする
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
			// attributeLocationを有効にする
			gl.enableVertexAttribArray(attL[i]);
			// attributeLocationを通知し登録する
			gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
		}
	}

	// IBOを生成する関数
	function create_ibo(data){
		// バッファオブジェクトの生成
		var ibo = gl.createBuffer();
		// バッファをバインドする
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
		// バッファにデータをセット
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
		// バッファのバインドを無効化
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		// 生成したIBOを返して終了
		return ibo;
	}

	function torus(row, column, irad, orad){
		var pos = new Array(), col = new Array(), idx = new Array();
		for(var i = 0; i <= row; i++){
			var r = Math.PI * 2 / row * i;
			var rr = Math.cos(r);
			var ry = Math.sin(r);
			for(var ii = 0; ii <= column; ii++){
				var tr = Math.PI * 2 / column * ii;
				var tx = (rr * irad + orad) * Math.cos(tr);
				var ty = ry * irad;
				var tz = (rr * irad + orad) * Math.sin(tr);
				pos.push(tx, ty, tz);
				var tc = hsva(360 / column * ii, 1, 1, 1);
				col.push(tc[0], tc[1], tc[2], tc[3]);
			}
		}
		for(i = 0; i < row; i++){
			for(ii = 0; ii < column; ii++){
				r = (column + 1) * i + ii;
				idx.push(r, r + column + 1, r + 1);
				idx.push(r + column + 1, r + column + 2, r + 1);
			}
		}
		return [pos, col, idx];
	}

	// HSVカラー取得用関数
	function hsva(h, s, v, a){
		if(s > 1 || v > 1 || a > 1){return;}
		var th = h % 360;
		var i = Math.floor(th / 60);
		var f = th / 60 - i;
		var m = v * (1 - s);
		var n = v * (1 - s * f);
		var k = v * (1 - s * (1 - f));
		var color = new Array();
		if(!s > 0 && !s < 0){
			color.push(v, v, v, a); 
		} else {
			var r = new Array(v, n, m, m, k, v);
			var g = new Array(k, v, v, n, m, m);
			var b = new Array(m, m, k, v, v, n);
			color.push(r[i], g[i], b[i], a);
		}
		return color;
	}
};