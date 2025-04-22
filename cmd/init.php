<?php

use BrickLayer\Lay\BobDBuilder\BobExec;
use BrickLayer\Lay\BobDBuilder\Helper\Console\Console;
use BrickLayer\Lay\BobDBuilder\Helper\Console\Format\Foreground;
use BrickLayer\Lay\Core\LayConfig;

$self = explode(DIRECTORY_SEPARATOR, $_SERVER['PHP_SELF']);

$dot_slash = str_repeat(".." . DIRECTORY_SEPARATOR, count($self) - 1);

include_once __DIR__ . DIRECTORY_SEPARATOR . $dot_slash . "vendor" . DIRECTORY_SEPARATOR . "autoload.php";

$pillar_dash = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR ;
$pillar_dash = str_replace([LayConfig::server_data()->root, "cmd" . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR], "", $pillar_dash);

if(!isset($argv[1])) {
    LayConfig::$ENV_IS_DEV = true;
    Console::log("Domain is not set", Foreground::red);
    Console::log("Command format: ", Foreground::yellow, newline: false);
    Console::log("php {$pillar_dash}init.php [EXISTING_DOMAIN_NAME] [COMMAND TAG]", Foreground::cyan);

    \BrickLayer\Lay\Core\Exception::kill_and_trace();
}

$domain = $argv[1];
$overwrite = isset($argv[2]) && $argv[2] == "--force";
$domain_dir = "web/domains/$domain/";

$exec_code = (new BobExec(
    "link:dir {$pillar_dash}static {$domain_dir}static/dev/ui/static " . ($overwrite ? " --force" : ""),
    true
))->response_code;

$overwrite = $exec_code;

if(!$overwrite)
    return;

Console::log("Falling from sky", Foreground::cyan);
Console::log("  V", Foreground::light_blue);

$domain_dir = str_replace(["/", "\\"], DIRECTORY_SEPARATOR, $domain_dir);
$default_dir = __DIR__ . DIRECTORY_SEPARATOR . "default" . DIRECTORY_SEPARATOR;

$current_dir = $domain_dir . "layout" . DIRECTORY_SEPARATOR;

print "  .\n";
file_put_contents(
    $current_dir . "head.inc",
    file_get_contents($default_dir . "head.inc")
);

print "  .\n";
file_put_contents(
    $current_dir . "script.inc",
    file_get_contents($default_dir . "script.inc")
);

print "  .\n";
file_put_contents(
    $current_dir . "body.inc",
    file_get_contents($default_dir . "body.inc")
);

print "  .\n";
file_put_contents(
    $domain_dir . "Plaster.php",
    "<?php \nnamespace Web\\$domain; \n" . file_get_contents($default_dir .  "plaster.php")
);

print "  .\n";
file_put_contents(
    $domain_dir . "plaster" . DIRECTORY_SEPARATOR . "homepage.view",
    file_get_contents($default_dir . "homepage.view")
);

Console::log("__o__", Foreground::blue);
Console::log("crash landed successfully!", Foreground::cyan);