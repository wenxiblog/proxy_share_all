package main

import (
    "crypto/aes"
    "crypto/cipher"
    "encoding/base64"
    "fmt"
    "io"
    "net/http"
    "os"
    "sync"
    "time"
)

type Source struct {
    URLTemplate string
    Key         string
    IV          string
}

var sources = []Source{
    {
        URLTemplate: "https://gitee.com/api/v5/repos/configshare/share/raw/%s?access_token=9019dae4f65bd15afba8888f95d7ebcc&ref=hotfix",
        Key:         "8YfiQ8wrkziZ5YFW",
        IV:          "8YfiQ8wrkziZ5YFW",
    },
    {
        URLTemplate: "https://raw.githubusercontent.com/configshare/share/hotfix/%s",
        Key:         "8YfiQ8wrkziZ5YFW",
        IV:          "8YfiQ8wrkziZ5YFW",
    },
    {
        URLTemplate: "https://shadowshare.v2cross.com/servers/%s",
        Key:         "8YfiQ8wrkziZ5YFW",
        IV:          "8YfiQ8wrkziZ5YFW",
    },
}

var client = &http.Client{Timeout: 10 * time.Second}

func fetchContent(url string) (string, error) {
    resp, err := client.Get(url)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    body, err := io.ReadAll(resp.Body)
    return string(body), err
}

func aesDecrypt(ciphertext, key, iv string) (string, error) {
    block, err := aes.NewCipher([]byte(key))
    if err != nil {
        return "", err
    }
    decoded, err := base64.StdEncoding.DecodeString(ciphertext)
    if err != nil {
        return "", err
    }
    mode := cipher.NewCBCDecrypter(block, []byte(iv))
    decrypted := make([]byte, len(decoded))
    mode.CryptBlocks(decrypted, decoded)
    decrypted = PKCS7Unpad(decrypted)
    return string(decrypted), nil
}

func PKCS7Unpad(data []byte) []byte {
    length := len(data)
    padLen := int(data[length-1])
    if padLen > length {
        return data
    }
    return data[:length-padLen]
}

func fetchAndDecrypt(filename string) []string {
    var wg sync.WaitGroup
    results := make(chan string, len(sources))

    for _, source := range sources {
        wg.Add(1)
        go func(src Source) {
            defer wg.Done()
            url := fmt.Sprintf(src.URLTemplate, filename)
            content, err := fetchContent(url)
            if err != nil {
                return
            }
            decrypted, err := aesDecrypt(content, src.Key, src.IV)
            if err == nil {
                results <- decrypted
            }
        }(source)
    }

    wg.Wait()
    close(results)

    var output []string
    for result := range results {
        output = append(output, result)
    }
    return output
}

func main() {
    if len(os.Args) < 2 {
        fmt.Println("Usage: ./main <filename>")
        return
    }
    filename := os.Args[1]
    results := fetchAndDecrypt(filename)
    for _, res := range results {
        fmt.Println(res)
    }
}
