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

define("GAME", $_POST['version'] ?? 0);

$playerId = $_POST['id'] ?? "xyz";
$action = $_POST['action'] ?? "update";
$field = isset($_POST['my_field']) ? (array)json_decode($_POST['my_field']) : array();

if(checkData("/tmp/".GAME."_players_".$playerId)){
    $gameId = getData("/tmp/".GAME."_players_".$playerId);
    $gameData = objectToArray(json_decode(getData("/tmp/".GAME."_games_".$gameId)));
} else {
    $ok = false;
    if(checkData("/tmp/".GAME."_waiting_game")){
        $gameId = getData("/tmp/".GAME."_waiting_game");
        removeData("/tmp/".GAME."_waiting_game");
        $gameData = objectToArray(json_decode(getData("/tmp/".GAME."_games_".$gameId)));
        if(isset($gameData['a']['last']) && time() - $gameData['a']['last'] > 1){
            removeData("/tmp/".GAME."_players_".$gameData['a']['id']);
            removeData("/tmp/".GAME."_games_".$gameId);
            unset($gameData);
        } else {
            $gameData['started'] = true;
            $gameData['b'] = array(
                "id" => $playerId,
                "field" => $field,
                "last" => time()
            );
            setData("/tmp/" . GAME . "_games_" . $gameId, json_encode($gameData));
            $ok = true;
        }
    }
    if(!$ok){
        $gameId = $playerId.generateRandomString(8);
        $gameData = array(
            "started" => false,
            "aPlayer" => $playerId,
            "a" => array(
                "id" => $playerId,
                "field" => $field,
                "last" => time()
            ),
            "b" => false,
            "dran" => ((rand(0,1) == 1) ? "a" : "b")
        );
        setData("/tmp/".GAME."_games_".$gameId, json_encode($gameData));
        setData("/tmp/".GAME."_waiting_game", $gameId);
    }
    if(isset($gameId)) setData("/tmp/".GAME."_players_".$playerId, $gameId);
}

$dran = isset($gameData) && ($gameData["aPlayer"] == $playerId ? "a" : "b") == $gameData["dran"];

function check_won(): bool
{
    global $gameData, $playerId;
    $fields = $gameData[($gameData["aPlayer"] == $playerId ? "b" : "a")]['field'];
    foreach($fields as $row) {
        foreach ($row as $f) {
            if(!isset($f['status'])) $f['status'] = false;
            if(!isset($f['beaten'])) $f['beaten'] = false;
            if($f['status'] && !$f['beaten']) return false;
        }
    }
    return true;
}

if(isset($gameData['started']) && $gameData['started'] && check_won()){
    $gameData['winner'] = ($gameData["aPlayer"] == $playerId ? "a" : "b");
}

if(isset($gameData) && !$gameData['started']) {
    $infoText = "Warten auf Gegner..";
    $my_status = 1;
    $gegner_status = 2;
} else if(isset($gameData['winner'])) {
    if ($gameData['winner'] == ($gameData["aPlayer"] == $playerId ? "a" : "b")) {
        $infoText = "Du hast Gewonnen!";
        $my_status = 1;
        $gegner_status = 5;
    } else {
        $infoText = "Du hast Verloren!";
        $my_status = 6;
        $gegner_status = 3;
    }
} else if(isset($gameData) && (isset($gameData['leaved']) || time()-$gameData[($gameData["aPlayer"] == $playerId ? "b" : "a")]['last'] > 3)){
    $gameData['leaved'] = true;
    $infoText = "Dein Gegner hat das Spiel verlassen!";
    $my_status = 1;
    $gegner_status = 3;
} else if($dran){
    $infoText = "Du bist dran!";
    $my_status = 1;
    $gegner_status = 4;
} else {
    $infoText = "Dein Gegner ist dran!";
    $my_status = 1;
    $gegner_status = 3;
}

if($action == "hit" && $dran) {
    $hitX = $_POST['hitX'];
    $hitY = $_POST['hitY'];

    $gameData[($gameData["aPlayer"] == $playerId ? "b" : "a")]['field'][$hitY][$hitX]['beaten'] = true;

    if(!isset($gameData[($gameData["aPlayer"] == $playerId ? "b" : "a")]['field'][$hitY][$hitX]['status']) || !$gameData[($gameData["aPlayer"] == $playerId ? "b" : "a")]['field'][$hitY][$hitX]['status']){
        $gameData["dran"] = ($gameData["aPlayer"] == $playerId ? "b" : "a");
    }
}

$gameData[($gameData["aPlayer"] == $playerId ? "a" : "b")]['last'] = time();

if(isset($gameId)) setData("/tmp/".GAME."_games_".$gameId, json_encode($gameData));

function show_all_beaten_fields($field): array
{
    $newField = array();
    foreach($field as $row){
        $rowFields = array();
        foreach($row as $f){
            if(isset($f['status']) && $f['status']){
                $f['status'] = true;
            } else {
                $f['status'] = false;
            }
            $rowFields[] = array(
                'beaten' => $f['beaten'] ?? false,
                'status' => ($f['beaten'] && $f['status'] ?? false)
            );
        }
        $newField[] = $rowFields;
    }
    return $newField;
}

echo json_encode(array(
    'id' => $playerId,
    'info_message' => $infoText,
    'my_status' => $my_status,
    'gegner_status' => $gegner_status,
    'my_field' => ((array)$gameData[($gameData["aPlayer"] == $playerId ? "a" : "b")])['field'],
    'gegner_field' => $gameData['started'] ? show_all_beaten_fields(($gameData[($gameData["aPlayer"] == $playerId ? "b" : "a")])['field']) : array()
));

return exit();