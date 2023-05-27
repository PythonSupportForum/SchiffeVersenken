<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
header('Access-Control-Max-Age: 30000');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

function generateRandomString($length = 10): string
{
    try {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[random_int(0, $charactersLength - 1)];
        }
        return $randomString;
    } catch(Exception $ex){
        return "xyz";
    }
}

function objectToArray($obj) {
    $arr = is_object($obj) ? get_object_vars($obj) : $obj;
    foreach ($arr as $key => $val) {
        if (is_object($val) || is_array($val)) {
            $arr[$key] = objectToArray($val);
        } else {
            $arr[$key] = $val;
        }
    }
    return $arr;
}

function checkData($key): bool
{
    $data = getDataFromFile();
    return isset($data[$key]);
}
function removeData($key){
    $data = getDataFromFile();
    unset($data[$key]);
    saveDataToFile($data);
}

function getData($key){
    $data = getDataFromFile();
    return $data[$key] ?? null;
}

function setData($key, $value){
    $data = getDataFromFile();
    $data[$key] = $value;
    saveDataToFile($data);
}

function getDataFromFile(){
    $data = file_get_contents('data.json');
    return json_decode($data, true);
}

function saveDataToFile($data){
    $json_data = json_encode($data);
    file_put_contents('data.json', $json_data);
}

$playerId = $_POST['id'] ?? "xyz";
$action = $_POST['action'] ?? "receive";
define("GAME", $_POST['version'] ?? 22);

if(checkData("/tmp/".GAME."_players_".$playerId)){
    $gameId = getData("/tmp/".GAME."_players_".$playerId);
    $gameData = objectToArray(json_decode(getData("/tmp/".GAME."_games_".$gameId)));
} else {
    if(checkData("/tmp/".GAME."_waiting_game")){
        $gameId = getData("/tmp/".GAME."_waiting_game");
        removeData("/tmp/".GAME."_waiting_game");
        $gameData = objectToArray(json_decode(getData("/tmp/".GAME."_games_".$gameId)));
        $gameData[($gameData["aPlayer"] == $playerId ? "b" : "a")][] = "hello b";
    } else {
        $gameId = $playerId.generateRandomString(8);
        $gameData = array("aPlayer" => $playerId, "a" => array(), "b" => array());
        setData("/tmp/".GAME."_games_".$gameId, json_encode($gameData));
        setData("/tmp/".GAME."_waiting_game", $gameId);
    }
    if(isset($gameId)) setData("/tmp/".GAME."_players_".$playerId, $gameId);
}

if($action == "receive"){
    echo implode(', ', $gameData[($gameData["aPlayer"] == $playerId ? "a" : "b")]);
    $gameData[($gameData["aPlayer"] == $playerId ? "a" : "b")] = array();
} else if($action == "send"){
    $gameData[($gameData["aPlayer"] == $playerId ? "b" : "a")][] = $_POST['text'];
}

if(isset($gameId)) setData("/tmp/".GAME."_games_".$gameId, json_encode($gameData));