function encryptStringInternal(string, key, iv) {
    // Concatenamos el IV al principio del mensaje antes de encriptar
    const stringWithIV = iv + string;
    let result = '';
    for (let i = 0; i < stringWithIV.length; i++) {
        result += String.fromCharCode(stringWithIV.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
}

const SECRET_KEY = '$SPM@2019';
const SECRET_IV = '171920'; // Cambiado a cadena simple

// Función de encriptación utilizando la clave y el IV
export const encryptString = (string) => {
    const key = SECRET_KEY;
    const iv = SECRET_IV;
    console.log("KEY: ", SECRET_KEY );
    console.log("IV: ", SECRET_IV);
    // Encriptar la cadena utilizando la función de encriptación interna
    const encrypted = encryptStringInternal(string, key, iv);
    
    // Retornar la cadena encriptada
    return encrypted;
};
