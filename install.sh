#!/bin/bash

set -e

#Basic updates
sudo apt-get -y update
sudo apt-get -y upgrade

#install access point tools
sudo apt install -y hostapd
sudo apt install -y dnsmasq
sudo DEBIAN_FRONTEND=noninteractive apt install -y netfilter-persistent iptables-persistent

#enable hostpd-service
sudo systemctl unmask hostapd.service
sudo systemctl enable hostapd.service

#Configure dhcp-server(uap0-interface) ip-address
sudo echo "hostname" > /etc/dhcpcd.conf
sudo echo "" >> /etc/dhcpcd.conf
sudo echo "clientid" >> /etc/dhcpcd.conf
sudo echo "" >> /etc/dhcpcd.conf
sudo echo "persistent" >> /etc/dhcpcd.conf
sudo echo "" >> /etc/dhcpcd.conf
sudo echo "option rapid_commit" >> /etc/dhcpcd.conf
sudo echo "" >> /etc/dhcpcd.conf
sudo echo "option domain_name_servers, domain_name, domain_search, host_name" >> /etc/dhcpcd.conf
sudo echo "option classless_static_routes" >> /etc/dhcpcd.conf
sudo echo "" >> /etc/dhcpcd.conf
sudo echo "option interface_mtu" >> /etc/dhcpcd.conf
sudo echo "" >> /etc/dhcpcd.conf
sudo echo "require dhcp_server_identifier" >> /etc/dhcpcd.conf
sudo echo "" >> /etc/dhcpcd.conf
sudo echo "slaac private" >> /etc/dhcpcd.conf
sudo echo "" >> /etc/dhcpcd.conf
sudo echo "#RaakeOS--IPSettings--Start" >> /etc/dhcpcd.conf
sudo echo "interface uap0" >> /etc/dhcpcd.conf
sudo echo "    static ip_address=192.168.58.1/24" >> /etc/dhcpcd.conf
sudo echo "    nohook wap_supplicant" >> /etc/dhcpcd.conf
sudo echo "" >> /etc/dhcpcd.conf
sudo echo "#interface eth0" >> /etc/dhcpcd.conf
sudo echo "#    static ip_address=192.168.7.51/24" >> /etc/dhcpcd.conf
sudo echo "#RaakeOS--IPSettings--End" >> /etc/dhcpcd.conf

#sudo mv /etc/sysctl.d/routed-ap.conf /etc/sysctl.d/routed-ap.conf.bak
sudo echo "net.ipv4.ip_forward=1" > "/etc/sysctl.d/routed-ap.conf"

sudo rfkill unblock wlan

#Configure dns-server 
sudo echo "interface=uap0" > "/etc/dnsmasq.conf"
sudo echo "dhcp-range=192.168.58.5,192.168.58.100,255.255.255.0,300d" >> "/etc/dnsmasq.conf"
sudo echo "domain=wlan" >> "/etc/dnsmasq.conf"
sudo echo "address=/rt.wlan/192.168.58.1" >> "/etc/dnsmasq.conf"

#Configure hostapd (Access point)
sudo echo "country_code=FI" > "/etc/hostapd/hostapd.conf"
sudo echo "interface=uap0" >> "/etc/hostapd/hostapd.conf"
sudo echo "ssid=RaakeContentLoggerRPI01" >> "/etc/hostapd/hostapd.conf"
sudo echo "hw_mode=g" >> "/etc/hostapd/hostapd.conf"
sudo echo "channel=7" >> "/etc/hostapd/hostapd.conf"
sudo echo "macaddr_acl=0" >> "/etc/hostapd/hostapd.conf"
sudo echo "auth_algs=1" >> "/etc/hostapd/hostapd.conf"
sudo echo "ignore_broadcast_ssid=0" >> "/etc/hostapd/hostapd.conf"
sudo echo "wpa=2" >> "/etc/hostapd/hostapd.conf"
sudo echo "wpa_passphrase=RaakeSmart" >> "/etc/hostapd/hostapd.conf"
sudo echo "wpa_key_mgmt=WPA-PSK" >> "/etc/hostapd/hostapd.conf"
sudo echo "wpa_pairwise=TKIP" >> "/etc/hostapd/hostapd.conf"
sudo echo "rsn_pairwise=CCMP" >> "/etc/hostapd/hostapd.conf"

#Create startup script
sudo echo "systemctl stop hostapd.service" > "/home/raake/raakeosapstart.sh"
sudo echo "systemctl stop dnsmasq.service" >> "/home/raake/raakeosapstart.sh"
sudo echo "systemctl stop dhcpcd.service" >> "/home/raake/raakeosapstart.sh"
sudo echo "" >> "/home/raake/raakeosapstart.sh"
sudo echo "iw dev uap0 del" >> "/home/raake/raakeosapstart.sh"
sudo echo "iw dev wlan0 interface add uap0 type __ap" >> "/home/raake/raakeosapstart.sh"
sudo echo "" >> "/home/raake/raakeosapstart.sh"
sudo echo "ifconfig uap0 up" >> "/home/raake/raakeosapstart.sh"
sudo echo "" >> "/home/raake/raakeosapstart.sh"
sudo echo "systemctl start hostapd.service" >> "/home/raake/raakeosapstart.sh"
sudo echo "sleep 10" >> "/home/raake/raakeosapstart.sh"
sudo echo "systemctl start dhcpcd.service" >> "/home/raake/raakeosapstart.sh"
sudo echo "sleep 5" >> "/home/raake/raakeosapstart.sh"
sudo echo "systemctl start dnsmasq.service" >> "/home/raake/raakeosapstart.sh"

#Configure system so that startup-script is executed in starting process
sudo echo "#!/bin/sh -e" > "/etc/rc.local"
sudo echo "#" >> "/etc/rc.local"
sudo echo "# rc.local" >> "/etc/rc.local"
sudo echo "#" >> "/etc/rc.local"
sudo echo "# This script is executed at the end of each multiuser runlevel." >> "/etc/rc.local"
sudo echo "# Make sure that the script will "exit 0" on success or any other" >> "/etc/rc.local"
sudo echo "# value on error." >> "/etc/rc.local"
sudo echo "#" >> "/etc/rc.local"
sudo echo "# In order to enable or disable this script just change the execution" >> "/etc/rc.local"
sudo echo "# bits." >> "/etc/rc.local"
sudo echo "#" >> "/etc/rc.local"
sudo echo "# By default this script does nothing." >> "/etc/rc.local"
sudo echo "" >> "/etc/rc.local"
sudo echo "# Print the IP address" >> "/etc/rc.local"
sudo echo "_IP=$(hostname -I) || true" >> "/etc/rc.local"
sudo echo "if [ "$_IP" ]; then" >> "/etc/rc.local"
sudo echo "  printf "My IP address is %s\n" "$_IP"" >> "/etc/rc.local"
sudo echo "fi" >> "/etc/rc.local"
sudo echo "" >> "/etc/rc.local"
sudo echo "/home/raake/raakeosapstart.sh" >> "/etc/rc.local"
sudo echo "/home/raake/raakeosusbdrivemount.sh" >> "/etc/rc.local"
sudo echo "exit 0" >> "/etc/rc.local"
sudo echo "" >> "/etc/rc.local"

sudo chmod +x /home/raake/raakeosapstart.sh

#Install git
sudo apt install -y git

#Get Content Logger source
git clone https://github.com/raakeos/contentlogger.git

# install Qt5 compinents OS
sudo apt-get install -y qtbase5-dev

#install nodejs
sudo apt-get install -y nodejs

#install npm
sudo apt-get install -y npm

#install express, cors and mariadb for nodejs
cd /home/raake/contentlogger/RaakeRestAPI
sudo npm install express
sudo npm install cors
sudo npm install mariadb
cd ../..

#Install NginX
sudo apt install -y nginx

#Change homepage folder
sudo sed -i 's_root /var/www/html;_root /home/raake/contentlogger/WebUI;_g' /etc/nginx/sites-available/default

#if using usb-drive
if [ ! -d "/mnt/contentlogger" ]
then
    sudo mkdir /mnt/contentlogger
    sudo chmod -R 777 /mnt/contentlogger

    #Create script for auto mounting
    sudo echo "#!/bin/bash" > "/home/raake/raakeosusbdrivemount.sh"
    sudo echo "sudo mount /dev/sda1 /mnt/contentlogger" >> "/home/raake/raakeosusbdrivemount.sh"
fi

sudo chmod +x /home/raake/raakeosusbdrivemount.sh

#Install MariaDB Server
sudo apt install mariadb-server -y 

#Install QMYSQL driver 
sudo apt-get install -y libqt5sql5-mysql

sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo netfilter-persistent save
sudo netfilter-persistent reload

sudo reboot
