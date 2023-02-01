#!/bin/bash

wget https://github.com/Qengineering/Install-OpenCV-Raspberry-Pi-32-bits/raw/main/OpenCV-4-5-5.sh
sudo chmod 755 ./OpenCV-4-5-5.sh
./OpenCV-4-5-5.sh 

red='\033[0;31m'
nocolor='\033[0m'
raakeDir="$( pwd; )";
raakeBinaryFolder="${raakeDir}/bin";
[ ! -d "$raakeBinaryFolder" ] && mkdir -p "$raakeBinaryFolder"

#RaakeTCPLoggerConnectionNode
echo -e "${red}Build RaakeTCPLoggerConnectionNode${nocolor}"
raakeTCPLoggerConnectionNode="${raakeDir}/RaakeTCPLoggerConnectionNode/rel"
[ ! -d "$raakeTCPLoggerConnectionNode" ] && mkdir -p "$raakeTCPLoggerConnectionNode"
cd $raakeTCPLoggerConnectionNode
qmake ../RaakeTCPLoggerConnectionNode.pro
sleep 1
sudo make -j7
sleep 1
sudo make clean
sleep 1
sudo cp ${raakeLogConnectionNodeFolder}/RaakeTCPLoggerConnectionNode${raakeBinaryFolder}
sleep 1


#RaakeS7ConnectionNode
echo -e "${red}Build RaakeS7ConnectionNode${nocolor}"
raakeS7ConnectionNodeFolder="${raakeDir}/RaakeS7ConnectionNode/rel"
[ ! -d "$raakeS7ConnectionNodeFolder" ] && mkdir -p "$raakeS7ConnectionNodeFolder"
cd $raakeS7ConnectionNodeFolder
qmake ../RaakeS7ConnectionNode.pro
sleep 1
sudo make -j7
sleep 1
sudo make clean
sleep 1
sudo cp ${raakeS7ConnectionNodeFolder}/RaakeS7ConnectionNode ${raakeBinaryFolder}
sleep 1


#RaakeStatusConnectionNode
echo -e "${red}Build RaakeStatusConnectionNode${nocolor}"
raakeStatusConnectionNode="${raakeDir}/RaakeStatusConnectionNode/rel"
echo "$( pwd; )"
echo "${raakeStatusConnectionNode}"
[ ! -d "$raakeStatusConnectionNode" ] && mkdir -p "$raakeStatusConnectionNode"
cd $raakeStatusConnectionNode
qmake ../RaakeStatusConnectionNode.pro
sleep 1
sudo make -j7
sleep 1
sudo make clean
sleep 1
sudo cp ${raakeStatusConnectionNode}/RaakeStatusConnectionNode ${raakeBinaryFolder}
sleep 1


#RaakeImageConnectionNode
echo -e "${red}Build RaakeImageConnectionNode${nocolor}"
raakeImageConnectionNode="${raakeDir}/RaakeImageConnectionNode/rel"
echo "$( pwd; )"
echo "${raakeImageConnectionNode}"
[ ! -d "$raakeImageConnectionNode" ] && mkdir -p "$raakeImageConnectionNode"
cd $raakeImageConnectionNode
qmake ../RaakeImageConnectionNode.pro
sleep 1
sudo make -j7
sleep 1
sudo make clean
sleep 1
sudo cp ${raakeImageConnectionNode}/RaakeImageConnectionNode ${raakeBinaryFolder}
sleep 1

##RaakeContentOrganizer
#echo -e "${red}Build RaakeContentOrganizer${nocolor}"
#raakeContentOrganizerFolder="${raakeDir}/RaakeContentOrganizer/rel"
#echo $raakeContentOrganizerFolder
#[ ! -d "$raakeContentOrganizerFolder" ] && mkdir -p "$raakeContentOrganizerFolder"
#cd $raakeContentOrganizerFolder
#qmake ../RaakeContentOrganizer.pro
#sleep 1
#sudo make -j7
#sleep 1
#sudo make clean
#sleep 1
#sudo cp ${raakeContentOrganizerFolder}/RaakeContentOrganizer ${raakeBinaryFolder}
#sleep 2


#RaakeContentLogger
echo -e "${red}Build RaakeContentLogger${nocolor}"
raakeContentLoggerFolder="${raakeDir}/RaakeContentLogger/rel"
[ ! -d "$raakeContentLoggerFolder" ] && mkdir -p "$raakeContentLoggerFolder"
cd $raakeContentLoggerFolder
qmake ../RaakeContentLogger.pro
sleep 1
sudo make -j7
sleep 1
sudo make clean
sleep 1
sudo cp ${raakeContentLoggerFolder}/RaakeContentLogger ${raakeBinaryFolder}
sleep 2

#RaakeSenseAirS8ConnectionNode
echo -e "${red}Build RaakeSenseAirS8ConnectionNode${nocolor}"
raakeSenseAirS8ConnectionNodeFolder="${raakeDir}/RaakeSenseAirS8ConnectionNode/rel"
[ ! -d "$raakeSenseAirS8ConnectionNodeFolder" ] && mkdir -p "$raakeSenseAirS8ConnectionNodeFolder"
cd $raakeSenseAirS8ConnectionNodeFolder
qmake ../RaakeSenseAirS8ConnectionNode.pro
sleep 1
sudo chmod -R 0777 $raakeSenseAirS8ConnectionNodeFolder
sudo make clean
sudo make -j7
sleep 1
sudo make clean
sleep 1
sudo cp ${raakeSenseAirS8ConnectionNodeFolder}/RaakeSenseAirS8ConnectionNode ${raakeBinaryFolder}
sleep 2


#RaakeBMP280ConnectionNode
echo -e "${red}Build RaakeBMP280ConnectionNode${nocolor}"
raakeBMP280ConnectionNodeFolder="${raakeDir}/RaakeBMP280ConnectionNode/rel"
[ ! -d "$raakeBMP280ConnectionNodeFolder" ] && mkdir -p "$raakeBMP280ConnectionNodeFolder"
cd $raakeBMP280ConnectionNodeFolder
qmake ../RaakeBMP280ConnectionNode.pro
sleep 1
sudo chmod -R 0777 $raakeBMP280ConnectionNodeFolder
sudo make clean
sudo make -j7
sleep 1
sudo make clean
sleep 1
sudo cp ${raakeBMP280ConnectionNodeFolder}/RaakeBMP280ConnectionNode ${raakeBinaryFolder}
sleep 2

##RaakeMariaDBCollector
#echo -e "${red}Build RaakeMariaDBCollector${nocolor}"
#raakeMariaDBCollectorFolder="${raakeDir}/RaakeMariaDBCollector/rel"
#[ ! -d "$raakeMariaDBCollectorFolder" ] && mkdir -p "$raakeMariaDBCollectorFolder"
#cd $raakeMariaDBCollectorFolder
#qmake ../RaakeMariaDBCollector.pro
#sleep 1
#sudo chmod -R 0777 $raakeMariaDBCollectorFolder
#sudo make clean
#sudo make -j7
#sleep 1
#sudo make clean
#sleep 1
#sudo cp ${raakeMariaDBCollectorFolder}/RaakeMariaDBCollector ${raakeBinaryFolder}
#sleep 2


sudo rm -r ${raakeTCPLoggerConnectionNode}
sudo rm -r ${raakeS7ConnectionNodeFolder}
sudo rm -r ${raakeStatusConnectionNode}
sudo rm -r ${raakeImageConnectionNode}
#sudo rm -r ${raakeContentOrganizerFolder}
sudo rm -r ${raakeContentLoggerFolder}
sudo rm -r ${raakeBMP280ConnectionNodeFolder}
sudo rm -r ${raakeSenseAirS8ConnectionNodeFolder}
#sudo rm -r ${raakeMariaDBCollectorFolder}
