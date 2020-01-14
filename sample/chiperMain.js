var ceaser = require('./ceaserChiper');
var md5 = require('md5');

console.log(ceaser.encrypt(9, 'Rhi how are you i am fine'));
console.log(ceaser.decrypt(9, 'Aqr qxf jan hxd r jv orwn'));
console.log(ceaser.decrypt(3, 'Qrghmv'));

console.log(md5('A가 B 에게 10만원을 전송함'));
