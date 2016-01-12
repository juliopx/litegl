"use_strict";
//Define WEBCONSTANTS ENUMS as statics
//sometimes I need some gl enums before having the gl context, solution: define them globally because the specs says they are constant:
var e = module.exports;
e.BYTE = 5120;
e.UNSIGNED_BYTE = 5121;
e.SHORT = 5122;
e.UNSIGNED_SHORT = 5123;
e.INT = 5124;
e.UNSIGNED_INT = 5125;
e.FLOAT = 5126;

e.ZERO = 0;
e.ONE = 1;
e.SRC_COLOR = 768;
e.ONE_MINUS_SRC_COLOR = 769;
e.SRC_ALPHA = 770;
e.ONE_MINUS_SRC_ALPHA = 771;
e.DST_ALPHA = 772;
e.ONE_MINUS_DST_ALPHA = 773;
e.DST_COLOR = 774;
e.ONE_MINUS_DST_COLOR = 775;
e.SRC_ALPHA_SATURATE = 776;
e.CONSTANT_COLOR = 32769;
e.ONE_MINUS_CONSTANT_COLOR = 32770;
e.CONSTANT_ALPHA = 32771;
e.ONE_MINUS_CONSTANT_ALPHA = 32772;
