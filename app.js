const express = require('express');
// web服务器
const FacialFusion = express();
const path = require('path');
const fs = require('fs');
const formidable = require('express-formidable');
const request = require('request');
const promisify = require('util').promisify;
FacialFusion.use(express.static(path.join(__dirname, 'public')));
// parse body
FacialFusion.use(formidable({
    // 文件上传目录
    uploadDir: path.join(__dirname, 'public', 'uploads'),
    // 最大上传文件为 2mb
    maxFileSize: 2 * 1024 * 1024,
    // 保留文件扩展名
    keepExtensions: true
}, [{ event: 'error', action: () => void(0) }]));

// request promise 封装
function req(options) {
    return new Promise((resolve, reject) => {
        request(options, (error, res, body) => {
            if (error) {
                return reject({ error });
            } else if (res.statusCode != 200) {
                return reject({ error: JSON.parse(body) });
            } else {
                return resolve(body); // 请求成功的处理逻辑
            }
        })

    })
}

async function faceWrap(templateimgpath, wrapimgpath, mergeRate = 50, featureRate = 45) {
    try {
        let url = 'https://api-cn.faceplusplus.com/imagepp/v1/mergeface';

        let form = {
            api_key: '1GAMAXrpseA5uI-knjAe2eVCH6W0JcZP',
            api_secret: 'jft6M_OP_12zd4ycMKmfoRT5YKXqIEHF',
            // template_base64: fs.readFileSync(templateimgpath, { encoding: 'base64' }),
            template_base64: templateimgpath,
            // merge_base64: fs.readFileSync(wrapimgpath, { encoding: 'base64' }),
            merge_base64: wrapimgpath,
            marge_rate: mergeRate,
            feature_rate: featureRate
        };
        let res = await req({
            url: url,
            method: "POST",

            headers: {
                "content-type": "multipart/form-data",
            },
            form
        }, function(error, response, body) {

            // console.log(typeof body);

            // for (const key in JSON.parse(body)) {
            //     console.log(key)
            // }
            // fs.writeFileSync(path.join(__dirname, 'public', 'uploads', '123.jpg'), JSON.parse(body).result, { encoding: 'base64' })


        });
        return JSON.parse(res).result
    } catch (err) {
        console.log('换脸时出错了', err);
        return err;
    }
}

// 判断文件是否为空
const rmFile = require('util').promisify(require('fs').unlink);
async function processFile(file) {
    // 判断文件是否为空
    if (file.size == 0) {
        // 删除空文件
        try {
            await rmFile(file.path);
        } catch (error) { console.log('图像删除失败：', error); }
        return '';
    } else {

        return file.path.split('public')[1].replace(/\\/g, '/');
    }
}




// 路由

//获取模板图片信息
FacialFusion.get('/getlist', (req, res) => {
    // 获取文件夹中文件列表
    try {
        let img = fs.readdirSync(path.join(__dirname, 'public', 'template'));

        img.forEach(function(currentValue, index, arr) {

            arr[index] = path.join('/', 'template', currentValue).replace(/\\/g, '/')

        });
        res.send(img);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
})

//保存上传的图片
FacialFusion.post('/upload', async(req, res) => {
    try {
        let imgArr = {};
        for (let index in req.files) {
            imgArr[index] = await processFile(req.files[index]);
        }
        res.send(imgArr);
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

})
FacialFusion.post('/getface', async(req, res) => {
    try {
        //检测客户端发来的是二进制代码还是路径
        var imgDate = req.fields.tplpath;
        if (imgDate.indexOf(".") != -1 && imgDate.length <= 50) { //当确定为路径
            //将路径读取为文件
            imgDate = fs.readFileSync(path.join('public', req.fields.tplpath), { encoding: 'base64' });
        }

        //获取脸部信息
        // const img = await faceWrap(path.join('public', req.fields.tplpath), path.join('public', req.fields.wrappath));
        const img = await faceWrap(imgDate, req.fields.wrappath);
        let { error } = img;
        if (error) {
            try {
                const infoList = {
                    IMAGE_ERROR_UNSUPPORTED_FORMAT: '图片无效',
                    INVALID_IMAGE_SIZE: '图片过大',
                    INVALID_IMAGE_URL: '图片无效',
                    IMAGE_FILE_TOO_LARGE: '图片无效',
                    NO_FACE_FOUND: '未检测到人脸',
                    BAD_FACE: '未检测到人脸',
                    INVALID_RECTANGLE: '未检测到人脸',
                    MISSING_ARGUMENTS: '参数无效',
                    IMAGE_DOWNLOAD_TIMEOUT: '请求超时',
                    AUTHENTICATION_ERROR: "api_key和api_secret不匹配",
                    CONCURRENCY_LIMIT_EXCEEDED: "并发数超过限制",
                    COEXISTENCE_ARGUMENTS: "同时传入了要求是二选一或多选一的参数",
                    API_NOT_FOUND: "所调用的API不存在",
                    NTERNAL_ERROR: "服务器内部错误"
                }
                const errKey = error.error_message.slice(0, error.error_message.indexOf(':'));
                const Msg = infoList[errKey];
                return res.status(500).send({ message: Msg ? Msg : '未知错误' });
            } catch (error) {
                return res.status(500).send({ message: '未知错误' });
            }
        }
        // const imgpath = path.join('public', 'uploads', Date.now() + '.jpg');
        // fs.writeFileSync(imgpath, img, { encoding: 'base64' })
        // res.send(imgpath.replace(/\\/g, '/').split('public')[1]);
        res.send(img);

    } catch (error) {
        res.status(500).send({ message: error.message })
    }

})






// catch
FacialFusion.use((err, req, res, next) => {
        res.status(500).send({ message: err.message });
    })
    // 监听端口
FacialFusion.listen(3000, () => console.log('\033[42;30m成功\033[0m', '服务器启动'));