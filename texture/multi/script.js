onload = function(){
    // キャンバス エレメント取得
    var c = document.getElementById('canvas');
    c.width = 500;
    c.height = 300;
    // webglコンテキストを取得
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');

    // シェーダの生成
    var v_shader = create_shader('vs');
    var f_shader = create_shader('fs');

    // プログラムオブジェクトの生成とリンク
    var prg = create_program(v_shader, f_shader);

    var attLocation = new Array(3);
    attLocation[0] = gl.getAttribLocation(prg, "position");
    attLocation[1] = gl.getAttribLocation(prg, "color");
    attLocation[2] = gl.getAttribLocation(prg, 'textureCoord');

    var attStride = new Array(3);
    attStride[0] = 3;
    attStride[1] = 4;
    attStride[2] = 2;

    // 頂点情報配列
    // 座標
    var vertex_position = [
        -1.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
    ];
    // 色
    var vertex_color = [
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0
    ];
    // texture coordination
    var vertex_texture_coord = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ];
    // インデックス
    var index = [
        0, 1, 2,
        3, 2, 1
    ];

    // vbo generation and registration.
    var vbo = new Array(3);
    vbo[0] = create_vbo(vertex_position);// 座標
    vbo[1] = create_vbo(vertex_color);// 色
    vbo[2] = create_vbo(vertex_texture_coord);// texture coordination
    set_attribute(vbo, attLocation, attStride);
    // ibo generation and registration.
    var ibo = create_ibo(index);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

    // 行列による座標変換処理
    var m = new matIV();
    // uniformLocation取得
    var uniLocation = new Array(3);
    uniLocation[0] = gl.getUniformLocation(prg, "mvpMatrix");
    uniLocation[1] = gl.getUniformLocation(prg, "texture0");
    uniLocation[2] = gl.getUniformLocation(prg, 'texture1');

    // 各種行列の生成と初期化
    var mMat = m.identity(m.create());
    var vMat = m.identity(m.create());
    var pMat = m.identity(m.create());
    var tmpMat = m.identity(m.create());
    var mvpMat = m.identity(m.create());

    // ビュー×プロジェクション座標変換行列
    m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMat);
    m.perspective(45, c.width / c.height, 0.1, 100, pMat);
    m.multiply(pMat, vMat, tmpMat);// mvp複合変換行列 作成

    // 深度テストを有効にする
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // prepare texture variable.
    var texture0 = null, texture1 = null;
    create_texture('texture0.png', 0);
    create_texture('texture1.png', 1);

    // angle counter
    var count = 0;
    // drawing
    (function(){
        // glコンテキスト初期化
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // カウンタ+1
        count++;
        // カウンタを角度(°)として、角度(rad)を生成
        var rad = (count % 360) * 2 * Math.PI;

        // activate texture unit.
        gl.activeTexture(gl.TEXTURE0);
        // テクスチャをバインドする
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        // uniform変数にテクスチャを登録
        gl.uniform1i(uniLocation[1], 0);

        // activate texture unit.
        gl.activeTexture(gl.TEXTURE1);
        // テクスチャをバインドする
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        // uniform変数にテクスチャを登録
        gl.uniform1i(uniLocation[2], 1);

        // 描画
        m.identity(mMat);// モデル変換行列の作成
        m.rotate(mMat, rad / 100, [0.0, 1.0, 0.0], mMat);
        m.multiply(tmpMat, mMat, mvpMat);// mvp複合変換行列 作成
        gl.uniformMatrix4fv(uniLocation[0], false, mvpMat);// mvp複合変換行列 登録
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

    // create texture
    function create_texture(source, number){
        var img = new Image();
        img.onload = function() {
            var tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            // bind data
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);

            // input texture
            switch (number) {
                case 0:
                    texture0 = tex;
                    break;
                case 1:
                    texture1 = tex;
                    break;
                default:
                    break;
            }
        };
        img.src = source;
    }
};