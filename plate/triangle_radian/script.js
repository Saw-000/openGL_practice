onload = function(){
    // キャンバス取得
    var c = document.getElementById("canvas")
    c.width = 500;
    c.height = 300;

    // webglコンテキスト初期化
    var gl = c.getContext("webgl") || c.getContext("experimental-webgl");

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // シェーダーの生成
    var v_shader = create_shader("vs");
    var f_shader = create_shader("fs");

    // プログラムの生成
    var prg = create_program(v_shader, f_shader);

    // attributeLocationを取得
    var attLocation = new Array(2);
    attLocation[0] = gl.getAttribLocation(prg, "position");// 位置
    attLocation[1] = gl.getAttribLocation(prg, "color");// 色

    // attributeLocationの次元設定
    var attStride = new Array(2);
    attStride[0] = 3;// 位置
    attStride[1] = 4;// 色

    // 頂点情報の配列を生成
    vertex_position = [// 位置
        0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ];
    vertex_color = [// 色
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];

    // vbo生成
    var vbo = new Array(2);
    vbo[0] = create_vbo(vertex_position);// 座標
    vbo[1] = create_vbo(vertex_color);// 色

    // vboをバインド
    set_attribute(vbo, attLocation, attStride);

    // 行列計算
    var uniLocation = gl.getUniformLocation(prg, "mvpMatrix");// uniformLocationの取得
    var m = new matIV();// 行列計算モジュール
    // 座標変換行列の初期化
    var mMat = m.identity(m.create());
    var vMat = m.identity(m.create());
    var pMat = m.identity(m.create());
    var vpMat = m.identity(m.create());
    var mvpMat = m.identity(m.create());

    // ビュー X プロジェクション 座標変換行列の生成
    m.lookAt([0.0, 0.0, 5.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMat);
    m.perspective(45, c.width/c.height, 0.1, 100, pMat);
    m.multiply(pMat, vMat, vpMat);

    // カウンタ宣言
    var count = 0;
    // 恒常ループ
    (function(){
        // glコンテキスト初期化
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // カウンタ+1
        count++;

        // カウンタを角度(°)として、角度(rad)を生成
        var rad = (count % 360) * 2 * Math.PI;

        // xy平面上の回転座標を生成
        var x = Math.cos(rad / 200);
        var y = Math.sin(rad / 200);

        // モデル1描画(xy平面上の回転)
        m.identity(mMat);
        m.translate(mMat, [x, y, 0.0], mMat);
        m.multiply(vpMat, mMat, mvpMat);
        gl.uniformMatrix4fv(uniLocation, false, mvpMat);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // モデル2描画(y軸回転)
        m.identity(mMat);
        m.translate(mMat, [0.0, -0.5, 0.0], mMat);
        m.rotate(mMat, rad / 100, [0, 1, 0], mMat);
        m.multiply(vpMat, mMat, mvpMat);
        gl.uniformMatrix4fv(uniLocation, false, mvpMat);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // モデル3描画(z軸回転)
        m.identity(mMat);
        m.translate(mMat, [-1.5,-0.5,0.0], mMat);
        var s = Math.sin(rad / 200);
        m.scale(mMat, [2*s,2*s,0.0], mMat);
        m.multiply(vpMat, mMat, mvpMat);
        gl.uniformMatrix4fv(uniLocation, false, mvpMat);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.flush();
        setTimeout(arguments.callee, 1000 / 30);
    })();


    /* function */
    // シェーダー作成
    function create_shader(id) {
        var shader;

        // スクリプトエレメントの取得
        var scriptElement = document.getElementById(id);
        if (!scriptElement) {return;}

        // シェーダーの生成
        switch (scriptElement.type) {
            case "x-shader/x-vertex":
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;
            case "x-shader/x-fragment":
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            default:
                return;
        };
        // シェーダーのコンパイル
        gl.shaderSource(shader, scriptElement.text);
        gl.compileShader(shader);
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        } else {// コンパイル失敗
            alert(gl.getShaderInfoLog(shader));
        };
    };

    // プログラム作成
    function create_program(vs, fs) {
        // プログラム本体作成
        var prg = gl.createProgram();
        // プログラムオブジェクトとシェーダーの紐付け
        gl.attachShader(prg, vs);// プログラムに頂点シェーダーを割り当て
        gl.attachShader(prg, fs);// プログラムにフラグメントシェーダーを割り当て
        gl.linkProgram(prg);// シェーダをリンク
        // リンクできたか
        if (gl.getProgramParameter(prg, gl.LINK_STATUS)) {
            gl.useProgram(prg);
            return prg;
        } else {
            alert(gl.getProgramInfoLog(prg));
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