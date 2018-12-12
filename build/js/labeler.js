export default function labeler(txt, nchars){
    //keep first word
    var first_word = txt.replace(/(-|\s).*$/, "");
    var remaining = txt.replace(/^[^\s]*\s/, " ");
    
    var n = remaining.length;
    var l = first_word.length;
    
    while(l < nchars && l < txt.length){
        first_word = first_word + txt.substring(l, l+1);
        l++;
    }

    if(first_word != txt){
        first_word = first_word + "...";
    }

    return first_word;
}
