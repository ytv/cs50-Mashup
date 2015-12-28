<?php

    require(__DIR__ . "/../includes/config.php");

    //** numerically indexed array of places
    $places = [];
    
    $query = $_GET["geo"];
    
    // remove unnecessary spaces
    while(strpos($query, '  ') !== false)
    {
        $query = str_replace('  ', ' ', $query);
    }
    
    // remove first character of query if it begins with a space
    if(strpos($query, " ") === 0)
    {
        $query = substr($query, 1);
    }
    
    $query = str_replace(" ,", ",", $query);
    $query = str_replace(", ", ",", $query);
    
    // parse query
    $queryArr = explode(",", $query);

    // find exact matches: postal codes first, then cities, and states
    search_qry($queryArr, "","postal_code", "", $places);
    
    if(empty($places))
    {
        search_qry($queryArr, "", "place_name", "", $places);
    }
    
    // if no exact matches found, find like matches:
    if(empty($places))
    {
        search_qry($queryArr, "%","place_name", "%", $places);
    }
    if(empty($places))
    {
        search_qry($queryArr, "", "postal_code", "%", $places);
    }
    if(empty($places))
    {
        search_qry($queryArr, "", "admin_name1", "%", $places);
    }
    if(empty($places))
    {
        search_qry($queryArr, "", "admin_code1", "", $places);
    }
    
    // output places as JSON (pretty-printed for debugging convenience)
    header("Content-type: application/json");
    print(json_encode($places, JSON_PRETTY_PRINT));
    
?>



