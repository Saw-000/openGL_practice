onload = function(){
    // キャンバス エレメント取得
    var c = document.getElementById('canvas');
    c.width = 500;
    c.height = 300;
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
        -1.0, 0.0, 0.0
    ];
    // 色
    var vertex_color = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];

    // vbo生成
    var vbo = new Array(2);
    vbo[0] = create_vbo(vertex_position);// 座標
    vbo[1] = create_vbo(vertex_color);// 色
    // vbo登録
    set_attribute(vbo, attLocation, attStride);

    // 行列による座標変換処理
    var m = new matIV();
    // uniformLocation取得
    var uniLocation = gl.getUniformLocation(prg, "mvpMatrix");
    // 各種行列の生成と初期化
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());

    // ビュー×プロジェクション座標変換行列
    m.lookAt([0.0, 0.0, 3.0], [0, 0, 0], [0, 1, 0], vMatrix);
    m.perspective(90, c.width / c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);

    // 描画
    // 1つ目のモデル
    m.translate(mMatrix, [1.5, 0.0, 0.0], mMatrix);// モデル変換行列の作成
    m.multiply(tmpMatrix, mMatrix, mvpMatrix);// mvp複合変換行列 作成
    gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);// mvp複合変換行列 登録
    gl.drawArrays(gl.TRIANGLES, 0, 3);// 描画
    // 2つ目のモデル
    m.identity(mMatrix);// モデル変換行列 初期化
    m.translate(mMatrix, [-1.5, 0.0, 0.0], mMatrix);// モデル変換行列の作成
    m.multiply(tmpMatrix, mMatrix, mvpMatrix);// mvp複合変換行列 作成
    gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);// mvp複合変換行列 登録
    gl.drawArrays(gl.TRIANGLES, 0, 3);// 描画

    // コンテキストへの描画
    gl.flush();


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
    }

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
};