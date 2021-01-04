onload = function(){
    // キャンバス エレメント取得
    var c = document.getElementById('canvas');
    c.width = 500;
    c.height = 300;

    // チェックボックスの参照を取得
	var che_culling = document.getElementById('cull');
	var che_front = document.getElementById('front');
    var che_depth_test = document.getElementById('depth');

    // webglコンテキストを取得
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');

    // canvas初期化
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // シェーダの生成
    var v_shader = create_shader('vs');
    var f_shader = create_shader('fs');

    // プログラムオブジェクトの生成とリンク
    var prg = create_program(v_shader, f_shader);

    var attLocation = new Array(2);
    attLocation[0] = gl.getAttribLocation(prg, "position");
    attLocation[1] = gl.getAttribLocation(prg, "color");

    var attStride = new Array(2);
    attStride[0] = 3;
    attStride[1] = 4;

    // 頂点情報配列
    // 座標
    var vertex_position = [
        0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        0.0, -1.0, 0.0
    ];
    // 色
    var vertex_color = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0
    ];
    // インデックス
    var index = [
        0, 1, 2,
        1, 2, 3
    ];

    // vbo生成
    var vbo = new Array(2);
    vbo[0] = create_vbo(vertex_position);// 座標
    vbo[1] = create_vbo(vertex_color);// 色
    // vbo登録
    set_attribute(vbo, attLocation, attStride);

    // ibo生成
    var ibo = create_ibo(index);
    // ibo登録
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

    // 行列による座標変換処理
    var m = new matIV();
    // uniformLocation取得
    var uniLocation = gl.getUniformLocation(prg, "mvpMatrix");
    // 各種行列の生成と初期化
    var mMat = m.identity(m.create());
    var vMat = m.identity(m.create());
    var pMat = m.identity(m.create());
    var tmpMat = m.identity(m.create());
    var mvpMat = m.identity(m.create());

    // ビュー×プロジェクション座標変換行列
    m.lookAt([0.0, 0.0, 3.0], [0, 0, 0], [0, 1, 0], vMat);
    m.perspective(45, c.width / c.height, 0.1, 100, pMat);
    m.multiply(pMat, vMat, tmpMat);// mvp複合変換行列 作成

    // カウンター
    var count = 0;
    // 描画
    (function(){
        // checkBoxの値によってカリングと深度テストを設定
		if(che_culling.checked){
			gl.enable(gl.CULL_FACE);
		}else{
			gl.disable(gl.CULL_FACE);
		}
		if(che_depth_test.checked){
			gl.enable(gl.DEPTH_TEST);
		}else{
			gl.disable(gl.DEPTH_TEST);
        }

        // glコンテキスト初期化
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // カウンタ+1
        count++;
        // カウンタを角度(°)として、角度(rad)を生成
        var rad = (count % 360) * 2 * Math.PI;
        // 描画
        // 1つ目のモデル
        m.identity(mMat);// モデル変換行列の作成
        m.translate(mMat, [0.5, 0.0, 0.0], mMat);// モデル変換行列の作成
        m.rotate(mMat, rad / 100, [0.0, 1.0, 0.0], mMat);
        m.multiply(tmpMat, mMat, mvpMat);// mvp複合変換行列 作成
        gl.uniformMatrix4fv(uniLocation, false, mvpMat);// mvp複合変換行列 登録
        // インデックスを用いた描画命令
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

        // 2つ目のモデル
        m.identity(mMat);// モデル変換行列の作成
        m.translate(mMat, [-0.5, 0.0, -1.0], mMat);// モデル変換行列の作成
        m.rotate(mMat, rad / 100, [0.0, 1.0, 0.0], mMat);
        m.multiply(tmpMat, mMat, mvpMat);// mvp複合変換行列 作成
        gl.uniformMatrix4fv(uniLocation, false, mvpMat);// mvp複合変換行列 登録
        // インデックスを用いた描画命令
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

        // コンテキストの再描画
        gl.flush();
        setTimeout(arguments.callee, 1000 / 30);
    })();

    /* function */
    // シェーダー作成
    function create_shader(id) {
        var shader;
        var scriptElement = document.getElementById(id);

        if (!scriptElement) {return;}

        switch (scriptElement.type) {
            case "x-shader/x-vertex":
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;
            case "x-shader/x-fragment":
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            default:
                return;
        }

        gl.shaderSource(shader, scriptElement.text);
        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        } else {
            alert(gl.getShaderInfoLog(shader));
        };
    };

    // プログラム作成
    function create_program(vs, fs) {
        var program = gl.createProgram();

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);

        gl.linkProgram(program);

        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);
            return program;
        } else {
            alert(gl.getProgramInfoLog(program));
        };
    };

    // vbo作成
    function create_vbo(data) {
        var vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }

    // vboをバインドし登録する
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

    // ibo作成
    function create_ibo(data) {
        var ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return ibo;
    }
};