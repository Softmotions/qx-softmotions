/**
 * String utility methods
 */
qx.Class.define("sm.lang.String", {

    statics :
    {
        ARRAY_EN : [
            "sh", "sch", "y", "ya", "zh", "ch", "yu", "yo",
            "i", "u", "k", "e", "n", "g", "z", "h", "", "f",
            "v", "a", "p", "r", "o", "l", "d", "e", "s", "m",
            "i", "t", "'", "b", "c",
            "SH", "SCH", "Y", "YA", "ZH", "CH", "YU", "YO",
            "Y", "U", "K", "E", "N", "G", "Z", "H", "", "F",
            "V", "A", "P", "R", "O", "L", "D", "E", "S", "M",
            "I", "T", "'", "B", "C"
        ],

        ARRAY_RU : [
            'ш', 'щ', 'ы', 'я', 'ж', 'ч', 'ю', 'ё', 'й', 'у',
            'к', 'е', 'н', 'г', 'з', 'х', 'ъ', 'ф', 'в', 'а',
            'п', 'р', 'о', 'л', 'д', 'э', 'с', 'м', 'и', 'т',
            'ь', 'б', 'ц',
            'Ш', 'Щ', 'Ы', 'Я', 'Ж', 'Ч', 'Ю', 'Ё', 'Й', 'У',
            'К', 'Е', 'Н', 'Г', 'З', 'Х', 'Ъ', 'Ф', 'В', 'А',
            'П', 'Р', 'О', 'Л', 'Д', 'Э', 'С', 'М', 'И', 'Т',
            'Ь', 'Б', 'Ц'
        ],

        RU_EN_MAP : {},

        /**
         * Transliterate russian encoded string into ascii lating string
         */
        translitRussian : function(str) {
            var res = [];
            for (var i = 0; i < str.length; ++i) {
                var tc = this.RU_EN_MAP[str.charAt(i)];
                res.push(tc ? tc : str.charAt(i));
            }
            return res.join("");
        }

    },

    defer : function(statics) {
        var i = -1;
        while (++i < statics.ARRAY_RU.length) {
            if (!statics.RU_EN_MAP[statics.ARRAY_RU[i]]) {
                statics.RU_EN_MAP[statics.ARRAY_RU[i]] = statics.ARRAY_EN[i];
            }
        }
    }
});